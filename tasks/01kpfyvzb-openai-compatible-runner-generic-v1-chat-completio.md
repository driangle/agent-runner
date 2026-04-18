---
title: "OpenAI-compatible runner — generic /v1/chat/completions SSE streaming runner"
id: "01kpfyvzb"
status: pending
priority: medium
type: feature
tags: ["runner", "openai", "streaming"]
created: "2026-04-18"
---

# OpenAI-compatible runner — generic /v1/chat/completions SSE streaming runner

## Objective

Implement a generic OpenAI-compatible runner that talks to any server exposing the `/v1/chat/completions` endpoint with SSE streaming. This enables out-of-the-box support for LM Studio, vLLM, LocalAI, and any other OpenAI-API-compatible inference server — no CLI required, just an HTTP base URL.

Unlike the CLI-based runners (Claude Code, Gemini, Codex), this runner communicates directly over HTTP using the OpenAI chat completions API format with `stream: true` SSE responses.

## Tasks

- [ ] Define the OpenAI-compatible runner options (base URL, API key, model, temperature, max tokens, system prompt, timeout)
- [ ] Implement HTTP client that posts to `{baseURL}/v1/chat/completions` with proper headers and SSE streaming
- [ ] Parse SSE `data: [DONE]` and `data: {...}` lines into typed message events (delta content, finish reason, usage)
- [ ] Implement `Run(prompt, options) → Result` (non-streaming, collects full response)
- [ ] Implement `RunStream(prompt, options) → Stream<Message>` (yields incremental deltas)
- [ ] Map OpenAI response fields to the common Result type (text, usage tokens, duration, is_error)
- [ ] Support optional API key via `Authorization: Bearer <key>` header (some local servers don't require auth)
- [ ] Add unit tests with a fake HTTP server that returns canned SSE responses
- [ ] Add integration test stubs gated behind env var / build tag
- [ ] Add example programs demonstrating simple run and streaming against a local server
- [ ] Implement in all four language libraries (Go, TypeScript, Python, Java)

## Acceptance Criteria

- Runner connects to any OpenAI-compatible endpoint given a base URL and model name
- `Run` returns a complete Result with text content, token usage, and duration
- `RunStream` yields incremental content deltas as they arrive via SSE
- Works with LM Studio, vLLM, and LocalAI without any server-specific code
- API key is optional (supports unauthenticated local servers)
- Unit tests cover SSE parsing, error handling, and result mapping using a fake HTTP server
- Runner follows the same common interface as Claude Code / Gemini / Codex runners
