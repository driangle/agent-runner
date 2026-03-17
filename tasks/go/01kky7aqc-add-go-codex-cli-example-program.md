---
title: "Add Go Codex CLI example program"
id: "01kky7aqc"
status: pending
priority: medium
type: feature
tags: ["go", "codex", "example"]
dependencies: ["01kkx4rkd"]
created: "2026-03-17"
---

# Add Go Codex CLI example program

## Objective

Add a working example program that demonstrates how to use the Go Codex CLI runner. The example should show both `Run` and `RunStream` usage with common options.

## Tasks

- [ ] Create `examples/go/codex/main.go` with a working example
- [ ] Include `Run` and `RunStream` usage with `context.Context`
- [ ] Add a `go.mod` for the example

## Acceptance Criteria

- Example compiles and runs against a local Codex CLI installation
- Example demonstrates both synchronous and streaming usage
- Example is self-contained with its own `go.mod`
