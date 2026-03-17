---
title: "Define Go common Runner interface and Claude Code types"
id: "01kkx4366"
status: completed
priority: high
type: feature
tags: ["go"]
created: "2026-03-17"
dependencies: ["01kkx4364"]
parent: 01kkx4yva
---

# Define Go types for CLI options and stream-json messages

## Objective

Define the common `Runner` interface in Go and all Claude Code-specific types. The common interface follows the spec from `INTERFACE.md` (task `01kkx4qbr`). Claude Code types cover CLI options and stream-json messages. Reference the doer `fmt/types.go` for stream-json types and the SDK TypeScript reference for the full set.

## Tasks

- [x] Define common `Runner` interface: `Run(ctx, prompt, opts) (*Result, error)` and `RunStream(ctx, prompt, opts) (<-chan Message, <-chan error)`
- [x] Define common types: `Options` (shared fields), `Result` (shared fields), `Message` (envelope)
- [x] Define Claude Code `Options` extending common options: AllowedTools, DisallowedTools, MCPConfig, JSONSchema, Continue, Resume, etc.
- [x] Define Claude Code stream-json message types: `AssistantMessage`, `ContentBlock`, `ResultMessage`, `SystemInitMessage`, `StreamEvent`, `RateLimitEvent`
- [x] Define `Usage` struct (input_tokens, output_tokens, cache tokens)
- [x] Define sentinel errors: `ErrNotFound`, `ErrTimeout`, `ErrNonZeroExit`, `ErrNoResult`
- [x] Ensure all types have JSON tags for correct serialization/deserialization

## Acceptance Criteria

- Common `Runner` interface is defined and documented
- Claude Code types implement/extend the common types
- Types compile and are well-documented with Go doc comments
- JSON tags match the actual field names in Claude CLI stream-json output
