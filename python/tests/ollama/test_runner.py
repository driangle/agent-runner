"""Tests for the Ollama runner with a fake HTTP server."""

import asyncio
import json

import pytest

from agentrunner import OllamaRunner, OllamaRunnerConfig, OllamaRunOptions
from agentrunner.errors import NoResultError, NotFoundError, RunnerError
from agentrunner.ollama import message_text, message_thinking


def _chat_line(content: str, done: bool = False, **kwargs) -> str:
    """Build a single ndjson chat response line."""
    d = {
        "model": "test-model",
        "created_at": "2024-01-01T00:00:00Z",
        "message": {"role": "assistant", "content": content},
        "done": done,
    }
    if done:
        d.update(
            {
                "total_duration": 500_000_000,  # 500ms in nanoseconds
                "prompt_eval_count": 10,
                "eval_count": 20,
            }
        )
    d.update(kwargs)
    return json.dumps(d)


def _thinking_line(content: str, thinking: str, done: bool = False, **kwargs) -> str:
    """Build a chat response line with thinking content."""
    d = {
        "model": "test-model",
        "created_at": "2024-01-01T00:00:00Z",
        "message": {"role": "assistant", "content": content, "thinking": thinking},
        "done": done,
    }
    if done:
        d.update(
            {
                "total_duration": 500_000_000,
                "prompt_eval_count": 10,
                "eval_count": 20,
            }
        )
    d.update(kwargs)
    return json.dumps(d)


async def _run_fake_server(
    lines: list[str], status: int = 200, host: str = "127.0.0.1"
) -> tuple[asyncio.Server, int]:
    """Start a fake HTTP server that returns the given ndjson lines."""
    body = "\n".join(lines) + "\n"
    body_bytes = body.encode("utf-8")

    async def handler(reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> None:
        # Read request (discard it).
        while True:
            line = await reader.readline()
            if line in (b"\r\n", b"\n", b""):
                break
        # Drain any request body.
        try:
            while not reader.at_eof():
                data = await asyncio.wait_for(reader.read(4096), timeout=0.1)
                if not data:
                    break
        except asyncio.TimeoutError:
            pass

        response = (
            f"HTTP/1.1 {status} OK\r\n"
            f"Content-Type: application/x-ndjson\r\n"
            f"Content-Length: {len(body_bytes)}\r\n"
            f"Connection: close\r\n"
            f"\r\n"
        ).encode("utf-8")
        writer.write(response + body_bytes)
        await writer.drain()
        writer.close()
        await writer.wait_closed()

    server = await asyncio.start_server(handler, host, 0)
    port = server.sockets[0].getsockname()[1]
    return server, port


async def test_simple_run() -> None:
    lines = [
        _chat_line("Hello"),
        _chat_line(" world"),
        _chat_line("!", done=True),
    ]
    server, port = await _run_fake_server(lines)
    async with server:
        runner = OllamaRunner(
            config=OllamaRunnerConfig(base_url=f"http://127.0.0.1:{port}")
        )
        result = await runner.run("hi", OllamaRunOptions(model="test-model"))

    assert result.text == "Hello world!"
    assert result.is_error is False
    assert result.cost_usd == 0.0
    assert result.usage.input_tokens == 10
    assert result.usage.output_tokens == 20
    assert result.duration_ms == 500.0
    assert result.session_id == ""


async def test_streaming() -> None:
    lines = [
        _chat_line("Hello"),
        _chat_line(" world"),
        _chat_line("!", done=True),
    ]
    server, port = await _run_fake_server(lines)
    async with server:
        runner = OllamaRunner(
            config=OllamaRunnerConfig(base_url=f"http://127.0.0.1:{port}")
        )
        session = await runner.run_stream("hi", OllamaRunOptions(model="test-model"))

        messages = []
        async for msg in session:
            messages.append(msg)

    assert len(messages) == 3
    assert messages[0].type == "assistant"
    assert messages[1].type == "assistant"
    assert messages[2].type == "result"

    result = await session.result
    assert result.text == "Hello world!"


async def test_message_text_accessor() -> None:
    lines = [
        _chat_line("Hello"),
        _chat_line("", done=True),
    ]
    server, port = await _run_fake_server(lines)
    async with server:
        runner = OllamaRunner(
            config=OllamaRunnerConfig(base_url=f"http://127.0.0.1:{port}")
        )
        session = await runner.run_stream("hi", OllamaRunOptions(model="test-model"))

        messages = []
        async for msg in session:
            messages.append(msg)

    assert message_text(messages[0]) == "Hello"
    assert message_text(messages[1]) is None  # empty content on done


async def test_message_thinking_accessor() -> None:
    lines = [
        _thinking_line("answer", "let me think..."),
        _chat_line("done", done=True),
    ]
    server, port = await _run_fake_server(lines)
    async with server:
        runner = OllamaRunner(
            config=OllamaRunnerConfig(base_url=f"http://127.0.0.1:{port}")
        )
        session = await runner.run_stream("hi", OllamaRunOptions(model="test-model"))

        messages = []
        async for msg in session:
            messages.append(msg)

    assert message_thinking(messages[0]) == "let me think..."
    assert message_thinking(messages[1]) is None


async def test_session_object() -> None:
    lines = [
        _chat_line("Paris"),
        _chat_line("", done=True),
    ]
    server, port = await _run_fake_server(lines)
    async with server:
        runner = OllamaRunner(
            config=OllamaRunnerConfig(base_url=f"http://127.0.0.1:{port}")
        )
        session = runner.start("capital of France?", OllamaRunOptions(model="test-model"))

        count = 0
        async for msg in session:
            count += 1

    assert count == 2
    result = await session.result
    assert result.text == "Paris"


async def test_model_required() -> None:
    runner = OllamaRunner()
    with pytest.raises(RunnerError, match="model is required"):
        runner.start("hi", OllamaRunOptions())


async def test_connection_refused() -> None:
    runner = OllamaRunner(
        config=OllamaRunnerConfig(base_url="http://127.0.0.1:1")
    )
    with pytest.raises(NotFoundError, match="connection failed"):
        await runner.run("hi", OllamaRunOptions(model="test-model"))


async def test_http_404() -> None:
    server, port = await _run_fake_server([], status=404)
    async with server:
        runner = OllamaRunner(
            config=OllamaRunnerConfig(base_url=f"http://127.0.0.1:{port}")
        )
        with pytest.raises(NotFoundError, match="404"):
            await runner.run("hi", OllamaRunOptions(model="test-model"))


async def test_no_result() -> None:
    # Stream with no done=True message.
    lines = [_chat_line("Hello")]
    server, port = await _run_fake_server(lines)
    async with server:
        runner = OllamaRunner(
            config=OllamaRunnerConfig(base_url=f"http://127.0.0.1:{port}")
        )
        with pytest.raises(NoResultError):
            await runner.run("hi", OllamaRunOptions(model="test-model"))


async def test_system_prompt() -> None:
    """Verify system prompt is passed through (we capture the request on the server side)."""
    captured_body: dict | None = None

    async def handler(reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> None:
        nonlocal captured_body
        # Read request line + headers.
        content_length = 0
        while True:
            line = await reader.readline()
            decoded = line.decode("utf-8", errors="replace").strip()
            if decoded.lower().startswith("content-length:"):
                content_length = int(decoded.split(":")[1].strip())
            if line in (b"\r\n", b"\n", b""):
                break

        body = await reader.readexactly(content_length)
        captured_body = json.loads(body)

        # Send response.
        resp_line = _chat_line("ok", done=True)
        resp_bytes = (resp_line + "\n").encode()
        response = (
            f"HTTP/1.1 200 OK\r\n"
            f"Content-Type: application/x-ndjson\r\n"
            f"Content-Length: {len(resp_bytes)}\r\n"
            f"Connection: close\r\n"
            f"\r\n"
        ).encode() + resp_bytes
        writer.write(response)
        await writer.drain()
        writer.close()
        await writer.wait_closed()

    server = await asyncio.start_server(handler, "127.0.0.1", 0)
    port = server.sockets[0].getsockname()[1]

    async with server:
        runner = OllamaRunner(
            config=OllamaRunnerConfig(base_url=f"http://127.0.0.1:{port}")
        )
        await runner.run(
            "hello",
            OllamaRunOptions(model="test-model", system_prompt="You are helpful."),
        )

    assert captured_body is not None
    messages = captured_body["messages"]
    assert messages[0] == {"role": "system", "content": "You are helpful."}
    assert messages[1] == {"role": "user", "content": "hello"}


async def test_model_options_passed() -> None:
    """Verify model options are included in the request body."""
    captured_body: dict | None = None

    async def handler(reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> None:
        nonlocal captured_body
        content_length = 0
        while True:
            line = await reader.readline()
            decoded = line.decode("utf-8", errors="replace").strip()
            if decoded.lower().startswith("content-length:"):
                content_length = int(decoded.split(":")[1].strip())
            if line in (b"\r\n", b"\n", b""):
                break

        body = await reader.readexactly(content_length)
        captured_body = json.loads(body)

        resp_line = _chat_line("ok", done=True)
        resp_bytes = (resp_line + "\n").encode()
        response = (
            f"HTTP/1.1 200 OK\r\n"
            f"Content-Type: application/x-ndjson\r\n"
            f"Content-Length: {len(resp_bytes)}\r\n"
            f"Connection: close\r\n"
            f"\r\n"
        ).encode() + resp_bytes
        writer.write(response)
        await writer.drain()
        writer.close()
        await writer.wait_closed()

    server = await asyncio.start_server(handler, "127.0.0.1", 0)
    port = server.sockets[0].getsockname()[1]

    async with server:
        runner = OllamaRunner(
            config=OllamaRunnerConfig(base_url=f"http://127.0.0.1:{port}")
        )
        await runner.run(
            "hello",
            OllamaRunOptions(
                model="test-model",
                temperature=0.5,
                top_k=40,
                seed=42,
            ),
        )

    assert captured_body is not None
    opts = captured_body["options"]
    assert opts["temperature"] == 0.5
    assert opts["top_k"] == 40
    assert opts["seed"] == 42
