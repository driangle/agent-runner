---
id: "01kkx7v5m"
title: "Implement TypeScript Claude Code CLI runner"
status: pending
priority: high
phase: typescript
dependencies: ["01kkx4yva"]
parent: 01kkx3f5h
tags: ["typescript", "claudecode"]
created: 2026-03-17
---

# Implement TypeScript Claude Code CLI runner

## Objective

Implement the Claude Code CLI runner in TypeScript, following the Go implementation as a reference. This is the first TS runner — it establishes the TypeScript common types, package structure, and patterns that other TS runners will follow.

## Tasks

- [ ] Initialize the TypeScript package (`package.json`, `tsconfig.json`, project structure)
- [ ] Define TypeScript common Runner interface and shared types (mirroring Go types)
- [ ] Define Claude Code-specific option extensions and message types
- [ ] Implement stream-json parser for Claude Code output
- [ ] Implement `run()` and `runStream()` for the Claude Code CLI
- [ ] Add session management (continue, resume)
- [ ] Write tests with mock subprocess
- [ ] Add package README

## Acceptance Criteria

- Claude Code runner implements the common `Runner` interface
- `run()` and `runStream()` work with the `claude` CLI
- All stream-json message types are parsed into typed TypeScript values
- Session continue/resume is supported
- Tests pass without requiring the real `claude` binary
