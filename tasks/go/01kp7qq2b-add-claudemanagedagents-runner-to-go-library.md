---
title: "Add ClaudeManagedAgents runner to Go library"
id: "01kp7qq2b"
status: pending
priority: high
type: feature
tags: ["runner", "managed-agents"]
created: "2026-04-15"
---

# Add ClaudeManagedAgents runner to Go library

## Objective

Implement a `ClaudeManagedAgents` runner in the Go library that talks to Anthropic's Managed Agents HTTP API (beta). This runner makes direct HTTP calls to create agents, environments, and sessions, then streams events via SSE. It must conform to the existing Runner interface (Run/RunStream) so callers can swap it in without code changes.

API docs: https://platform.claude.com/docs/en/managed-agents/overview

## Tasks

- [ ] Define Go types for the Managed Agents API: Agent, Environment, Session, event types (agent.message, agent.tool_use, session.status_*, etc.), request/response structs
- [ ] Implement API client with `context.Context` support: create/get/list agents, create/get/list environments, create/get/list/delete sessions, send events, list events
- [ ] Implement SSE stream reader for `GET /v1/sessions/{id}/stream` with reconnection and event deduplication
- [ ] Implement `Run(ctx, prompt, options)` — create agent+environment+session (or reuse existing), send user.message, stream until idle with end_turn, return Result
- [ ] Implement `RunStream(ctx, prompt, options)` — same setup but return a channel or iterator of Message events
- [ ] Handle custom tool flow: detect `requires_action` stop reason, surface events for caller, accept tool results
- [ ] Add options: API key, model, system prompt, tools config, environment config (packages, networking), timeout, metadata, `*slog.Logger`
- [ ] Add beta header (`anthropic-beta: managed-agents-2026-04-01`) and version header to all requests
- [ ] Map session usage/stats to common Result fields (text, usage, cost, duration, session ID, is_error)
- [ ] Add unit tests (table-driven) for type parsing, option building, event mapping, SSE parsing
- [ ] Add integration tests with an `httptest.Server` returning canned API/SSE responses
- [ ] Add example programs: simple run, streaming, session resume, custom tools

## Acceptance Criteria

- `ClaudeManagedAgents` runner implements the same Runner interface as the existing Claude Code runner
- `Run()` returns a Result with text, usage, cost, duration, session ID, and is_error fields
- `RunStream()` returns a channel or iterator of typed Message events including agent messages, tool use/results, and status changes
- All API requests include the required beta and version headers
- All public functions accept `context.Context` for cancellation
- Custom tool use flow is supported
- Unit tests are table-driven and cover type parsing, option building, and SSE event parsing
- Integration tests verify the full Run/RunStream path against an `httptest.Server`
- Logging via `*slog.Logger` logs the HTTP request details
- `make check-go` passes
