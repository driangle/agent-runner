---
title: "Add ClaudeManagedAgents runner to TypeScript library"
id: "01kp7qq1v"
status: pending
priority: high
type: feature
tags: ["runner", "managed-agents"]
created: "2026-04-15"
---

# Add ClaudeManagedAgents runner to TypeScript library

## Objective

Implement a `ClaudeManagedAgents` runner in the TypeScript library that talks to Anthropic's Managed Agents HTTP API (beta). Unlike the Claude Code CLI runner which shells out to a subprocess, this runner makes direct HTTP calls to create agents, environments, and sessions, then streams events via SSE. It must conform to the existing Runner interface (Run/RunStream) so callers can swap it in without code changes.

API docs: https://platform.claude.com/docs/en/managed-agents/overview

## Tasks

- [ ] Define TypeScript types for the Managed Agents API: Agent, Environment, Session, Event types (agent.message, agent.tool_use, agent.tool_result, session.status_*, etc.), request/response bodies
- [ ] Implement API client layer: create/get/list/archive agents, create/get/list environments, create/get/list/delete sessions, send events, list events
- [ ] Implement SSE stream client for `GET /v1/sessions/{id}/stream` with reconnection and event deduplication
- [ ] Implement `Run(prompt, options)` — create agent+environment+session (or reuse existing), send user.message, stream until session goes idle with stop_reason end_turn, return Result
- [ ] Implement `RunStream(prompt, options)` — same setup but yield Message events via async iterator as they arrive
- [ ] Handle custom tool flow: detect `requires_action` stop reason, emit events for caller to handle, accept tool results
- [ ] Add options: API key, model, system prompt, tools config, environment config (packages, networking), timeout, metadata
- [ ] Add beta header (`anthropic-beta: managed-agents-2026-04-01`) and version header to all requests
- [ ] Map session usage/stats to the common Result fields (text, usage, cost, duration, session ID, is_error)
- [ ] Add unit tests for type parsing, option building, event mapping, and SSE parsing
- [ ] Add integration tests with a mock HTTP server that returns canned API/SSE responses
- [ ] Add example programs: simple run, streaming, session resume, custom tools

## Acceptance Criteria

- `ClaudeManagedAgents` runner implements the same Runner interface as the existing Claude Code runner
- `Run()` returns a Result with text, usage, cost, duration, session ID, and is_error fields
- `RunStream()` yields typed Message events via async iterator including agent messages, tool use/results, and status changes
- All API requests include the required beta and version headers
- Custom tool use flow is supported: caller receives tool use events and can send back results
- Unit tests cover type parsing, option building, and SSE event parsing
- Integration tests verify the full Run/RunStream path against a mock HTTP server
- `make check-ts` passes
