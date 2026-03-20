"""Ollama API request/response types."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class ChatMessage:
    """A single message in the chat history."""

    role: str
    content: str
    thinking: str | None = None


@dataclass
class ModelOptions:
    """Ollama model parameters sent as the ``options`` field."""

    temperature: float | None = None
    num_ctx: int | None = None
    num_predict: int | None = None
    seed: int | None = None
    stop: list[str] | None = None
    top_k: int | None = None
    top_p: float | None = None
    min_p: float | None = None

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {}
        if self.temperature is not None:
            d["temperature"] = self.temperature
        if self.num_ctx is not None:
            d["num_ctx"] = self.num_ctx
        if self.num_predict is not None:
            d["num_predict"] = self.num_predict
        if self.seed is not None:
            d["seed"] = self.seed
        if self.stop is not None:
            d["stop"] = self.stop
        if self.top_k is not None:
            d["top_k"] = self.top_k
        if self.top_p is not None:
            d["top_p"] = self.top_p
        if self.min_p is not None:
            d["min_p"] = self.min_p
        return d


@dataclass
class ChatResponse:
    """A single ndjson line from the streaming /api/chat response."""

    model: str = ""
    created_at: str = ""
    message: ChatMessage = field(default_factory=lambda: ChatMessage(role="assistant", content=""))
    done: bool = False
    done_reason: str | None = None
    total_duration: int | None = None
    load_duration: int | None = None
    prompt_eval_count: int | None = None
    prompt_eval_duration: int | None = None
    eval_count: int | None = None
    eval_duration: int | None = None

    @staticmethod
    def from_dict(d: dict[str, Any]) -> ChatResponse:
        msg_data = d.get("message", {})
        return ChatResponse(
            model=d.get("model", ""),
            created_at=d.get("created_at", ""),
            message=ChatMessage(
                role=msg_data.get("role", "assistant"),
                content=msg_data.get("content", ""),
                thinking=msg_data.get("thinking"),
            ),
            done=d.get("done", False),
            done_reason=d.get("done_reason"),
            total_duration=d.get("total_duration"),
            load_duration=d.get("load_duration"),
            prompt_eval_count=d.get("prompt_eval_count"),
            prompt_eval_duration=d.get("prompt_eval_duration"),
            eval_count=d.get("eval_count"),
            eval_duration=d.get("eval_duration"),
        )
