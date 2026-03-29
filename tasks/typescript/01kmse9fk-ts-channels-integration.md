---
id: "01kmse9fk"
title: "TypeScript library channels integration (session.send)"
status: completed
priority: high
effort: medium
parent: "01kma0s35"
dependencies: ["01kmse9cq"]
tags: ["channels", "typescript"]
created: 2026-03-28
---

# TypeScript library channels integration (session.send)

## Objective

Integrate two-way channel support into the TypeScript agentrunner library. Add `channelEnabled` option, manage channel server lifecycle on session start, implement `session.send()`, and parse channel reply messages from the stream.

## Tasks

- [x] Add `channelEnabled` option to ClaudeRunOptions
- [x] On start: create temp Unix socket, generate MCP config, merge with user mcpConfig, set env var, add CLI flags
- [x] Implement `session.send(ChannelMessage)`
- [x] Parse channel replies into typed messages on the stream
- [x] Unit and integration tests
- [x] TypeScript example: two-way channel communication

## Acceptance Criteria

- `channelEnabled` option enables channel support transparently
- `session.send()` delivers messages to the channel server via Unix socket
- Channel replies appear as typed messages on the session stream
- Unit tests cover option wiring, arg building, and message parsing
- Integration tests with fake channel server validate the full round-trip
- Example program demonstrates two-way channel communication
