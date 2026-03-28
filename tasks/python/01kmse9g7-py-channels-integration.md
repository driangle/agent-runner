---
id: "01kmse9g7"
title: "Python library channels integration (session.send)"
status: pending
priority: high
effort: medium
parent: "01kma0s35"
dependencies: ["01kmse9cq"]
tags: ["channels", "python"]
created: 2026-03-28
---

# Python library channels integration (session.send)

## Objective

Integrate two-way channel support into the Python agentrunner library. Add `channel_enabled` option, manage channel server lifecycle on session start, implement `session.send()`, and parse channel reply messages from the async iterator.

## Tasks

- [ ] Add `channel_enabled` option to ClaudeRunOptions
- [ ] On start: create temp Unix socket, generate MCP config, merge with user mcpConfig, set env var, add CLI flags
- [ ] Implement `session.send(ChannelMessage)`
- [ ] Parse channel replies into typed messages on the async iterator
- [ ] Unit and integration tests
- [ ] Python example: two-way channel communication

## Acceptance Criteria

- `channel_enabled` option enables channel support transparently
- `session.send()` delivers messages to the channel server via Unix socket
- Channel replies appear as typed messages on the async iterator
- Unit tests cover option wiring, arg building, and message parsing
- Integration tests with fake channel server validate the full round-trip
- Example program demonstrates two-way channel communication
