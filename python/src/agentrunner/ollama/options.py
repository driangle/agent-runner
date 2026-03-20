"""Ollama runner configuration and run options."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol, runtime_checkable

from ..types import RunOptions


@runtime_checkable
class Logger(Protocol):
    """Minimal logger interface (matches stdlib logging.Logger)."""

    def debug(self, msg: str, *args: Any, **kwargs: Any) -> None: ...
    def error(self, msg: str, *args: Any, **kwargs: Any) -> None: ...


@dataclass
class OllamaRunnerConfig:
    """Configuration for creating an Ollama runner."""

    base_url: str = "http://localhost:11434"
    logger: Logger | None = None


@dataclass
class OllamaRunOptions(RunOptions):
    """Ollama-specific options extending common RunOptions."""

    temperature: float | None = None
    num_ctx: int | None = None
    num_predict: int | None = None
    seed: int | None = None
    stop: list[str] | None = field(default=None)
    top_k: int | None = None
    top_p: float | None = None
    min_p: float | None = None
    format: str | None = None
    keep_alive: str | None = None
    think: bool | None = None
