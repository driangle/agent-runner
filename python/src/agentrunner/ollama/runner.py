"""Ollama runner implementation using the Ollama HTTP API."""

from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator
from http import HTTPStatus
from typing import Any

from ..errors import (
    CancelledError,
    NoResultError,
    NotFoundError,
    ParseError,
    RunnerError,
    TimeoutError,
)
from ..types import Message, Result, Usage
from .options import OllamaRunnerConfig, OllamaRunOptions
from .types import ChatResponse, ModelOptions

DEFAULT_BASE_URL = "http://localhost:11434"


class OllamaSession:
    """Session encapsulates a running Ollama API request.

    Supports ``async for msg in session`` to iterate messages,
    and ``await session.result`` to get the final result.
    """

    def __init__(
        self,
        config: OllamaRunnerConfig,
        prompt: str,
        options: OllamaRunOptions,
    ) -> None:
        self._config = config
        self._prompt = prompt
        self._options = options

        self._loop = asyncio.get_running_loop()
        self._queue: asyncio.Queue[Message | None] = asyncio.Queue()
        self._result_future: asyncio.Future[Result] = self._loop.create_future()
        self._aborted = False
        self._task: asyncio.Task[None] = asyncio.ensure_future(self._run_request())

    async def _run_request(self) -> None:
        try:
            base_url = self._config.base_url or DEFAULT_BASE_URL
            body = _build_request_body(self._prompt, self._options)

            if self._config.logger:
                self._config.logger.debug(
                    "executing Ollama API request",
                    extra={"method": "POST", "url": f"{base_url}/api/chat"},
                )

            reader, writer = await _http_post_stream(
                base_url, "/api/chat", json.dumps(body)
            )

            text_parts: list[str] = []
            final_resp: ChatResponse | None = None

            try:
                while True:
                    if self._aborted:
                        break

                    raw_line = await reader.readline()
                    if not raw_line:
                        break

                    line = raw_line.decode("utf-8", errors="replace").strip()
                    if not line:
                        continue

                    try:
                        chunk = ChatResponse.from_dict(json.loads(line))
                    except (json.JSONDecodeError, KeyError) as exc:
                        raise ParseError(f"invalid JSON: {line}") from exc

                    if chunk.message.content:
                        text_parts.append(chunk.message.content)

                    if chunk.done:
                        final_resp = chunk

                    msg = Message(
                        type="result" if chunk.done else "assistant",
                        raw=line,
                    )
                    await self._queue.put(msg)
            finally:
                writer.close()
                try:
                    await writer.wait_closed()
                except Exception:
                    pass

            if self._aborted:
                self._result_future.set_exception(CancelledError("execution cancelled"))
                return

            if not final_resp:
                self._result_future.set_exception(NoResultError())
                return

            usage = Usage(
                input_tokens=final_resp.prompt_eval_count or 0,
                output_tokens=final_resp.eval_count or 0,
            )

            self._result_future.set_result(
                Result(
                    text="".join(text_parts),
                    is_error=False,
                    exit_code=0,
                    usage=usage,
                    cost_usd=0.0,
                    duration_ms=(
                        final_resp.total_duration / 1e6
                        if final_resp.total_duration
                        else 0.0
                    ),
                    session_id="",
                )
            )
        except (CancelledError, TimeoutError, NotFoundError, ParseError, NoResultError):
            if not self._result_future.done():
                self._result_future.set_exception(
                    __import__("sys").exc_info()[1]  # type: ignore[arg-type]
                )
        except OSError as exc:
            err = NotFoundError(f"connection failed: {exc}")
            if not self._result_future.done():
                self._result_future.set_exception(err)
        except Exception as exc:
            if not self._result_future.done():
                self._result_future.set_exception(RunnerError(str(exc)))
        finally:
            await self._queue.put(None)

    def __aiter__(self) -> AsyncIterator[Message]:
        return self._message_iter()

    async def _message_iter(self) -> AsyncIterator[Message]:
        while True:
            msg = await self._queue.get()
            if msg is None:
                break
            yield msg

    @property
    def result(self) -> asyncio.Future[Result]:
        return self._result_future

    def abort(self) -> None:
        self._aborted = True

    def send(self, input: Any) -> None:
        raise NotImplementedError("send is not supported for Ollama runner")


class OllamaRunner:
    """Ollama runner — talks to the Ollama HTTP API.

    Construct directly::

        runner = OllamaRunner()
        runner = OllamaRunner(config=OllamaRunnerConfig(base_url="http://...", logger=logger))
    """

    def __init__(self, config: OllamaRunnerConfig | None = None) -> None:
        self._config = config or OllamaRunnerConfig()

    def start(
        self,
        prompt: str,
        options: OllamaRunOptions | None = None,
    ) -> OllamaSession:
        opts = options or OllamaRunOptions()
        if not opts.model:
            raise RunnerError("model is required for Ollama runner")

        timeout = opts.timeout
        session = OllamaSession(self._config, prompt, opts)

        if timeout is not None and timeout > 0:
            loop = asyncio.get_running_loop()
            loop.call_later(timeout, session.abort)

        return session

    async def run(
        self,
        prompt: str,
        options: OllamaRunOptions | None = None,
    ) -> Result:
        session = self.start(prompt, options)
        async for _msg in session:
            pass
        return await session.result

    async def run_stream(
        self,
        prompt: str,
        options: OllamaRunOptions | None = None,
    ) -> OllamaSession:
        return self.start(prompt, options)


async def _http_post_stream(
    base_url: str, path: str, body: str
) -> tuple[asyncio.StreamReader, asyncio.StreamWriter]:
    """Open a raw HTTP POST connection and return the response body stream.

    Uses asyncio streams directly to avoid external dependencies.
    Raises NotFoundError on connection failure or HTTP 404.
    """
    from urllib.parse import urlparse

    parsed = urlparse(base_url)
    host = parsed.hostname or "localhost"
    port = parsed.port or 80
    use_ssl = parsed.scheme == "https"

    try:
        if use_ssl:
            import ssl

            ctx = ssl.create_default_context()
            reader, writer = await asyncio.open_connection(host, port, ssl=ctx)
        else:
            reader, writer = await asyncio.open_connection(host, port)
    except OSError as exc:
        raise NotFoundError(f"connection failed: {exc}") from exc

    # Send HTTP request.
    body_bytes = body.encode("utf-8")
    request_lines = (
        f"POST {path} HTTP/1.1\r\n"
        f"Host: {host}:{port}\r\n"
        f"Content-Type: application/json\r\n"
        f"Content-Length: {len(body_bytes)}\r\n"
        f"Connection: close\r\n"
        f"\r\n"
    )
    writer.write(request_lines.encode("utf-8"))
    writer.write(body_bytes)
    await writer.drain()

    # Read status line.
    status_line = await reader.readline()
    status_str = status_line.decode("utf-8", errors="replace").strip()
    parts = status_str.split(" ", 2)
    if len(parts) < 2:
        raise NotFoundError(f"invalid HTTP response: {status_str}")

    status_code = int(parts[1])

    # Read headers (discard them, we just need the body stream).
    while True:
        header_line = await reader.readline()
        if header_line in (b"\r\n", b"\n", b""):
            break

    if status_code == HTTPStatus.NOT_FOUND:
        raise NotFoundError("model not found (HTTP 404)")
    if status_code >= 400:
        raise RunnerError(f"HTTP {status_code}")

    return reader, writer


def _build_request_body(prompt: str, options: OllamaRunOptions) -> dict[str, Any]:
    """Build the JSON request body for POST /api/chat."""
    messages: list[dict[str, str]] = []

    system_prompt = options.system_prompt or ""
    if options.append_system_prompt:
        if system_prompt:
            system_prompt += "\n" + options.append_system_prompt
        else:
            system_prompt = options.append_system_prompt

    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})

    messages.append({"role": "user", "content": prompt})

    body: dict[str, Any] = {
        "model": options.model,
        "messages": messages,
        "stream": True,
    }

    if options.think is not None:
        body["think"] = options.think
    if options.format:
        body["format"] = options.format
    if options.keep_alive:
        body["keep_alive"] = options.keep_alive

    model_opts = _build_model_options(options)
    if model_opts:
        body["options"] = model_opts

    return body


def _build_model_options(options: OllamaRunOptions) -> dict[str, Any] | None:
    """Build the model options dict, or None if no options are set."""
    opts = ModelOptions(
        temperature=options.temperature,
        num_ctx=options.num_ctx,
        num_predict=options.num_predict,
        seed=options.seed,
        stop=options.stop,
        top_k=options.top_k,
        top_p=options.top_p,
        min_p=options.min_p,
    )
    d = opts.to_dict()
    return d if d else None
