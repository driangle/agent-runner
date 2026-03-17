---
title: "Implement Go Claude Code CLI runner"
id: "01kkx4yva"
status: completed
priority: high
type: feature
tags: ["go", "claudecode"]
created: "2026-03-17"
parent: 01kkx3f5s
---

# Implement Go Claude Code CLI runner

## Objective

Implement the Claude Code CLI runner in Go, satisfying the common Runner interface. This is the first and most complete runner implementation, covering process spawning, stream-json parsing, streaming callbacks, and session management.

## Children

- `01kkx4364` — Initialize Go module and package structure
- `01kkx4366` — Define Go common Runner interface and Claude Code types
- `01kkx4367` — Implement Claude Code stream-json parser
- `01kkx4368` — Implement Claude Code core runner
- `01kkx4369` — Add Claude Code streaming callback support
- `01kkx436b` — Add Claude Code session management
- `01kkx436c` — Write tests and add Go package README

## Acceptance Criteria

- Claude Code runner implements the common `Runner` interface
- `Run` and `RunStream` work with the `claude` CLI
- All stream-json message types are parsed into typed Go values
- Session continue/resume is supported
- Tests pass with mock command builder (no real CLI needed)
