---
id: "01kkx7v98"
title: "Implement TypeScript Ollama runner"
status: pending
priority: medium
phase: typescript
dependencies: ["01kkx54rn", "01kkx7v5m"]
parent: 01kkx3f5h
tags: ["typescript", "ollama"]
created: 2026-03-17
---

# Implement TypeScript Ollama runner

## Objective

Implement the Ollama runner in TypeScript, following the Go Ollama implementation as a reference. This runner talks to the Ollama HTTP API rather than shelling out to a CLI, enabling fully local agent execution.

## Tasks

- [ ] Define Ollama-specific option extensions (baseURL, temperature, topK, etc.)
- [ ] Define Ollama-specific message/output types
- [ ] Implement `run()` and `runStream()` against the Ollama HTTP API
- [ ] Add tests with mock HTTP server

## Acceptance Criteria

- Ollama runner implements the common `Runner` interface
- Callers can swap between CLI runners and Ollama without code changes
- Supports streaming responses from the Ollama API
- Tests pass without requiring a running Ollama instance
