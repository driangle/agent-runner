---
id: "01kkx7vaa"
title: "Implement TypeScript Gemini CLI runner"
status: pending
priority: medium
phase: typescript
dependencies: ["01kkx7v98", "01kkx4rk2"]
parent: 01kkx3f5h
tags: ["typescript", "gemini"]
created: 2026-03-17
---

# Implement TypeScript Gemini CLI runner

## Objective

Implement the Gemini CLI runner in TypeScript, following the Go Gemini implementation as a reference.

## Tasks

- [ ] Define Gemini-specific option extensions and message types
- [ ] Implement stream-json parser for Gemini output
- [ ] Implement `run()` and `runStream()` for the Gemini CLI
- [ ] Add tests with mock subprocess

## Acceptance Criteria

- Gemini runner implements the common Runner interface
- Callers can swap between runners without code changes
- Tests pass without requiring the real `gemini` binary
