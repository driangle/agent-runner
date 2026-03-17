---
title: "Add Go Ollama example program"
id: "01kky7aqf"
status: pending
priority: medium
type: feature
tags: ["go", "ollama", "example"]
dependencies: ["01kkx54rn"]
created: "2026-03-17"
---

# Add Go Ollama example program

## Objective

Add a working example program that demonstrates how to use the Go Ollama runner. The example should show both `Run` and `RunStream` usage with common options.

## Tasks

- [ ] Create `examples/go/ollama/main.go` with a working example
- [ ] Include `Run` and `RunStream` usage with `context.Context`
- [ ] Add a `go.mod` for the example

## Acceptance Criteria

- Example compiles and runs against a local Ollama installation
- Example demonstrates both synchronous and streaming usage
- Example is self-contained with its own `go.mod`
