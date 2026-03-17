---
title: "Implement Go Ollama runner"
id: "01kkx54rn"
status: pending
priority: medium
type: feature
tags: ["go", "ollama"]
created: "2026-03-17"
dependencies: ["01kkx7v5m"]
---

# Implement Go Ollama runner

## Objective

Implement a local Ollama runner in Go that satisfies the common Runner interface. Unlike the other runners which shell out to a CLI, this runner interacts with the Ollama API (local HTTP server) to run models. This enables fully local, offline agent execution.

## Tasks

- [ ] Research Ollama API (REST endpoints, streaming format, model management)
- [ ] Define Ollama-specific option extensions (model, temperature, context window, etc.)
- [ ] Define Ollama-specific message/output types
- [ ] Implement `Run` and `RunStream` against the Ollama HTTP API
- [ ] Add tests with mock HTTP server

## Acceptance Criteria

- Ollama runner implements the common `Runner` interface
- Callers can swap between CLI runners and Ollama without code changes
- Supports streaming responses from the Ollama API
- Tests pass without requiring a running Ollama instance
