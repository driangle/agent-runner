---
id: "01kmse9ep"
title: "Go library channels integration (session.Send)"
status: completed
priority: high
effort: medium
parent: "01kma0s35"
dependencies: ["01kmse9cq"]
tags: ["channels", "go"]
created: 2026-03-28
---

# Go library channels integration (session.Send)

## Objective

Integrate two-way channel support into the Go agentrunner library. Add `WithChannelEnabled()` option, manage channel server lifecycle on session start, implement `session.Send()`, and parse channel reply messages from the stream.

## Tasks

- [x] Add `WithChannelEnabled()` option to ClaudeOptions
- [x] On start: create temp Unix socket, generate MCP config, merge with user mcpConfig, set env var
- [x] Wire `--dangerously-load-development-channels server:agentrunner-channel` into arg builder
- [x] Implement `session.Send(ctx, ChannelMessage)` — connect to socket and write message
- [x] Parse channel reply messages from stream into `MessageTypeChannelReply`
- [x] Unit and integration tests
- [x] Go example: two-way channel communication

## Acceptance Criteria

- `WithChannelEnabled()` option enables channel support transparently
- `session.Send()` delivers messages to the channel server via Unix socket
- Channel replies appear as typed messages on the session message stream
- Unit tests cover option wiring, arg building, and message parsing
- Integration tests with fake channel server validate the full round-trip
- Example program demonstrates two-way channel communication
