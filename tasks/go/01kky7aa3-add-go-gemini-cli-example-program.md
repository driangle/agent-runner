---
title: "Add Go Gemini CLI example program"
id: "01kky7aa3"
status: pending
priority: medium
type: feature
tags: ["go", "gemini", "example"]
dependencies: ["01kkx4rk2"]
created: "2026-03-17"
---

# Add Go Gemini CLI example program

## Objective

Add a working example program that demonstrates how to use the Go Gemini CLI runner. The example should show both `Run` and `RunStream` usage with common options.

## Tasks

- [ ] Create `examples/go/gemini/main.go` with a working example
- [ ] Include `Run` and `RunStream` usage with `context.Context`
- [ ] Add a `go.mod` for the example

## Acceptance Criteria

- Example compiles and runs against a local Gemini CLI installation
- Example demonstrates both synchronous and streaming usage
- Example is self-contained with its own `go.mod`
