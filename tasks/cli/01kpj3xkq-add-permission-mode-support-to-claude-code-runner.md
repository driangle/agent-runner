---
title: "Add --permission-mode support to Claude Code runner"
id: "01kpj3xkq"
status: completed
priority: high
type: feature
tags: ["go", "claudecode"]
created: "2026-04-19"
completed_at: 2026-04-19
---

# Add --permission-mode support to Claude Code runner

## Objective

Add a `WithPermissionMode(mode string)` option that passes `--permission-mode <mode>` to the Claude Code CLI. This is the native way to control permissions, replacing the need to map custom values to `DangerouslySkipPermissions`. Valid modes: `default`, `acceptEdits`, `auto`, `plan`, `dontAsk`, `bypassPermissions`.

When both `PermissionMode` and `DangerouslySkipPermissions` are set, `PermissionMode` takes precedence.

## Tasks

- [x] Add `PermissionMode string` field to the options struct in `go/claudecode/options.go`
- [x] Add `WithPermissionMode(mode string)` option function in `go/claudecode/options.go`
- [x] Update `buildArgs()` in `go/claudecode/runner.go` to append `--permission-mode <mode>` when `PermissionMode` is set
- [x] Ensure `PermissionMode` takes precedence over `DangerouslySkipPermissions` (skip `--dangerously-skip-permissions` when `PermissionMode` is set)
- [x] Add unit tests for the new option and argument building logic
- [x] Update smoke test if applicable (no smoke test exists)

## Acceptance Criteria

- `WithPermissionMode("auto")` causes `--permission-mode auto` to appear in the CLI args
- When both `WithPermissionMode("plan")` and `WithDangerouslySkipPermissions()` are set, only `--permission-mode plan` is passed (not `--dangerously-skip-permissions`)
- When only `WithDangerouslySkipPermissions()` is set (no `PermissionMode`), `--dangerously-skip-permissions` is still passed for backward compatibility
- All existing tests continue to pass
- `make check` passes
