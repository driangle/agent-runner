---
title: "Go public API idiomacy review"
id: "01kmsh4f3"
status: completed
priority: high
type: chore
tags: ["api", "go"]
created: "2026-03-28"
---

# Go public API idiomacy review

## Objective

Review and fix the Go library's public API to follow idiomatic Go conventions. The API is well-structured overall (functional options, `context.Context`, channel-based streaming, sentinel errors, `*slog.Logger`) but has several issues affecting usability and type safety.

## Tasks

### High

- [x] `Start` should return `(*Session, error)` — already implemented. Pre-flight errors (version check, `LookPath`, pipe creation, `cmd.Start`) return immediately.

### Medium

- [x] `RunStream` two-channel return is awkward — removed `RunStream` entirely. Callers use `Start` which returns `*Session` with `.Messages` channel and `.Result()`. Updated README examples.
- [x] `Message.Parsed` is `any` — `claudecode.ParseMessage(msg) (*StreamMessage, bool)` already exists as a typed accessor.
- [x] `Extra map[any]any` is exported — already unexported (`extra map[any]any`) with `SetExtra`/`GetExtra` methods.
- [x] Missing typed accessors on `Message` — `ToolName()`, `ToolInput()`, `ToolOutput()`, `IsResult()`, `IsError()`, `ErrorMessage()` all implemented via interface assertions on `Parsed`.

### Low

- [x] Boolean options should be parameterless — `WithSkipPermissions()`, `WithContinue()`, `WithIncludePartialMessages()` already take no args. Fixed stale README examples.
- [x] `NewSession` should not be exported — cannot be unexported because Go's visibility rules require it in the `agentrunner` package (unexported Session fields) while `claudecode` and `ollama` sub-packages need to call it. Improved doc comment to clarify it's for runner implementations.
- [x] `ResultOrError` should not be exported — no such type exists in the codebase.
- [x] Example re-parses messages unnecessarily — example already uses `claudecode.ParseMessage(msg)` correctly.
- [x] `DurationMs int64` should be `time.Duration` — `Result.Duration` is already `time.Duration`. Fixed stale README docs.
- [x] `CommandBuilder` export is unnecessary — already unexported (`commandBuilder` lowercase, `withCommandBuilder` lowercase).
- [x] Package import path ends in `/go` — acceptable trade-off for monorepo structure (noted, no action).

## Acceptance Criteria

- All high and medium severity items are resolved
- `make check-go` passes
- Public API surface contains no unexported-worthy types
- Examples compile and use the idiomatic patterns
