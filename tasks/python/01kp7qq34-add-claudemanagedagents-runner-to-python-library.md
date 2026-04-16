---
title: "Add ClaudeManagedAgents runner to Python library"
id: "01kp7qq34"
status: pending
priority: high
type: feature
tags: ["runner", "managed-agents"]
created: "2026-04-15"
---

# Add ClaudeManagedAgents runner to Python library

## Objective

Implement a `ClaudeManagedAgents` runner in the Python library that talks to Anthropic's Managed Agents HTTP API (beta). This runner makes direct HTTP calls to create agents, environments, and sessions, then streams events via SSE. It must conform to the existing Runner interface (run/run_stream) so callers can swap it in without code changes.

API docs: https://platform.claude.com/docs/en/managed-agents/overview

## Tasks

- [ ] Define Python types (dataclasses or Pydantic models) for the Managed Agents API: Agent, Environment, Session, event types (agent.message, agent.tool_use, session.status_*, etc.)
- [ ] Implement async API client using httpx or aiohttp: create/get/list agents, create/get/list environments, create/get/list/delete sessions, send events, list events
- [ ] Implement SSE stream client for `GET /v1/sessions/{id}/stream` with reconnection and event deduplication
- [ ] Implement `run(prompt, options)` — create agent+environment+session (or reuse existing), send user.message, stream until idle with end_turn, return Result
- [ ] Implement `run_stream(prompt, options)` — same setup but yield Message events via async generator as they arrive
- [ ] Handle custom tool flow: detect `requires_action` stop reason, yield events for caller, accept tool results
- [ ] Add options: api_key, model, system_prompt, tools config, environment config (packages, networking), timeout, metadata
- [ ] Add beta header (`anthropic-beta: managed-agents-2026-04-01`) and version header to all requests
- [ ] Map session usage/stats to common Result fields (text, usage, cost, duration, session_id, is_error)
- [ ] Add unit tests (pytest) for type parsing, option building, event mapping, SSE parsing
- [ ] Add integration tests with a mock HTTP server (aiohttp test server or respx) returning canned API/SSE responses
- [ ] Add example programs: simple run, streaming, session resume, custom tools

## Acceptance Criteria

- `ClaudeManagedAgents` runner implements the same Runner interface as the existing Claude Code runner
- `run()` returns a Result with text, usage, cost, duration, session_id, and is_error fields
- `run_stream()` yields typed Message events via async generator including agent messages, tool use/results, and status changes
- All API requests include the required beta and version headers
- Custom tool use flow is supported
- Logging via `logging.getLogger("agentrunner.managed_agents")` logs HTTP request details
- Unit tests cover type parsing, option building, and SSE event parsing
- Integration tests verify the full run/run_stream path against a mock HTTP server
- `make check-python` passes
