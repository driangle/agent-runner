"""Typed accessor functions for Ollama messages."""

from __future__ import annotations

from ..types import Message


def message_text(msg: Message) -> str | None:
    """Return the text content from an assistant or result message, or None."""
    d = msg._raw_dict()
    message = d.get("message", {})
    content = message.get("content")
    if content:
        return content
    return None


def message_thinking(msg: Message) -> str | None:
    """Return the thinking content from a message, or None."""
    d = msg._raw_dict()
    message = d.get("message", {})
    return message.get("thinking") or None
