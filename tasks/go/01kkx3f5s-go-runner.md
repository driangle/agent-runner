---
title: "Create Go agentrunner library"
id: "01kkx3f5s"
status: pending
priority: high
type: feature
tags: ["go"]
created: "2026-03-17"
phase: go
effort: large
---

# Create Go agentrunner library

## Objective

Build the Go implementation of `agentrunner` in the `go/` directory. The library provides an idiomatic Go interface for invoking AI coding agent CLIs (Claude Code, Gemini, Codex) through a common Runner interface.

## Tasks

- [ ] Initialize the Go module (`go.mod`)
- [ ] Define common Runner interface and shared types
- [ ] Implement Claude Code runner
- [ ] Implement Gemini CLI runner
- [ ] Implement Codex CLI runner
- [ ] Write tests
- [ ] Add package README

## Acceptance Criteria

- Common Runner interface works across all supported CLIs
- Supports both streaming and non-streaming modes
- Exposes idiomatic Go types for all inputs/outputs
- Has passing tests covering core functionality
