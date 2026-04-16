---
title: "Add ClaudeManagedAgents runner to Java library"
id: "01kp7qq3d"
status: pending
priority: high
type: feature
tags: ["runner", "managed-agents"]
created: "2026-04-15"
---

# Add ClaudeManagedAgents runner to Java library

## Objective

Implement a `ClaudeManagedAgents` runner in the Java library that talks to Anthropic's Managed Agents HTTP API (beta). This runner makes direct HTTP calls to create agents, environments, and sessions, then streams events via SSE. It must conform to the existing Runner interface (run/runStream) so callers can swap it in without code changes.

API docs: https://platform.claude.com/docs/en/managed-agents/overview

## Tasks

- [ ] Define Java types for the Managed Agents API: Agent, Environment, Session, event types (agent.message, agent.tool_use, session.status_*, etc.) using builder pattern
- [ ] Implement HTTP client using java.net.http.HttpClient: create/get/list agents, create/get/list environments, create/get/list/delete sessions, send events, list events
- [ ] Implement SSE stream reader for `GET /v1/sessions/{id}/stream` with reconnection and event deduplication
- [ ] Implement `run(prompt, options)` — create agent+environment+session (or reuse existing), send user.message, stream until idle with end_turn, return CompletableFuture<Result>
- [ ] Implement `runStream(prompt, options)` — same setup but return a Flow.Publisher<Message> or callback-based stream of events
- [ ] Handle custom tool flow: detect `requires_action` stop reason, emit events for caller, accept tool results
- [ ] Add options: apiKey, model, systemPrompt, tools config, environment config (packages, networking), timeout, metadata
- [ ] Add beta header (`anthropic-beta: managed-agents-2026-04-01`) and version header to all requests
- [ ] Map session usage/stats to common Result fields (text, usage, cost, duration, sessionId, isError)
- [ ] Add unit tests (JUnit) for type parsing, option building, event mapping, SSE parsing
- [ ] Add integration tests with MockWebServer or WireMock returning canned API/SSE responses
- [ ] Add example programs: simple run, streaming, session resume, custom tools

## Acceptance Criteria

- `ClaudeManagedAgents` runner implements the same Runner interface as the existing Claude Code runner
- `run()` returns a CompletableFuture<Result> with text, usage, cost, duration, sessionId, and isError fields
- `runStream()` emits typed Message events including agent messages, tool use/results, and status changes
- All API requests include the required beta and version headers
- Builder pattern used for all configuration objects
- Custom tool use flow is supported
- Logging via SLF4J logs HTTP request details
- Unit tests cover type parsing, option building, and SSE event parsing
- Integration tests verify the full run/runStream path against a mock HTTP server
- `make check-java` passes
