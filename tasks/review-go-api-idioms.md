# Go Public API Idiomacy Review

Overall the API is well-structured — functional options, `context.Context` threading, channel-based streaming, sentinel errors, and `*slog.Logger` are all idiomatic. Below are the issues found, ordered roughly by impact.

## 1. `Start` should return `(*Session, error)`, not just `*Session`

**Severity: High**

`Start` currently always returns a `*Session`, pushing all errors into `session.Result()`. This means a caller who forgets to call `Result()` silently swallows errors like "binary not found." In idiomatic Go, constructive operations that can fail return an error:

```go
// Current — error is hidden
session := runner.Start(ctx, prompt)

// Proposed
session, err := runner.Start(ctx, prompt)
if err != nil { ... }
```

Synchronous, pre-flight errors (version check, `LookPath`, pipe creation, `cmd.Start`) should be returned immediately. The goroutine + channels are only needed once the process is running. This also removes the need for `ResultOrError` — startup errors come back from `Start`, and runtime errors come back from `Result()`.

## 2. `RunStream` return signature is awkward

**Severity: Medium**

Returning `(<-chan Message, <-chan error)` forces every caller to write a `select` loop or drain-then-check pattern. Since `Start` already exists and is strictly more powerful, `RunStream` adds little value. Consider either:

- **Dropping `RunStream`** — callers who want streaming use `Start` directly (it's already equally simple).
- **Or** making `RunStream` return a `*Session` too (it's just `Start` with a different name at that point).

The two-channel pattern is uncommon in Go standard library APIs and easy to misuse (e.g., forgetting to drain `errCh`).

## 3. `Message.Parsed` is `any` — loses type safety

**Severity: Medium**

The `Parsed any` field forces callers to type-assert:

```go
sm := msg.Parsed.(*claudecode.StreamMessage) // runtime panic if wrong
```

Consider making `Message` generic or providing a strongly-typed accessor:

```go
// Option A: typed accessor in the runner package (already exists but could be improved)
func claudecode.ParseMessage(msg agentrunner.Message) (*StreamMessage, bool)

// Option B: generic Message[T]
type Message[T any] struct { ... Parsed T }
```

`ParseMessage` already exists but returns `(*StreamMessage, error)` and re-parses `Raw` if `Parsed` isn't the right type. It should just return `(*StreamMessage, bool)` since a wrong-type `Parsed` isn't an error — it's a type mismatch, and the `bool` idiom (like a map lookup) is more natural.

## 4. `Extra map[any]any` is exported

**Severity: Medium**

Using `map[any]any` for runner-specific extension opts works but is untyped and invisible to callers. Every runner-specific option function (`WithAllowedTools`, etc.) writes into this opaque bag. Two alternatives:

- **Embed runner options directly**: Have `claudecode.RunOptions` embed `agentrunner.Options` and pass it to `Start`. This is the simplest Go pattern.
- **Use `context.Context`-style typed keys**: The current approach is close but `map[any]any` should at minimum be `map[any]any` with unexported key types (which it is — good), but the `Extra` field itself shouldn't be exported. Callers shouldn't interact with it directly.

At minimum, **unexport `Extra`** and provide a `SetExtra`/`GetExtra` pair if needed. Right now any caller can corrupt the map.

## 5. Missing typed accessors on `Message` per the interface spec

**Severity: Medium**

INTERFACE.md specifies `ToolName()`, `ToolInput()`, `ToolOutput()`, `Result()`, `IsError()`, and `ErrorMessage()` accessors on `Message`. The Go library only implements `Text()`, `Thinking()`, and `IsResult()`. The missing accessors force callers into the `Parsed` type assertion + field access pattern for common operations.

## 6. Boolean options should be parameterless

**Severity: Low**

Boolean flag options that are only meaningful when `true` should not take a parameter in idiomatic Go. Nobody writes `WithSkipPermissions(false)`. Same applies to `WithContinue(bool)` and `WithIncludePartialMessages(bool)`:

```go
// Current
agentrunner.WithSkipPermissions(true)
claudecode.WithIncludePartialMessages(true)

// Idiomatic
agentrunner.WithSkipPermissions()
claudecode.WithIncludePartialMessages()
```

## 7. `NewSession` should not be exported

**Severity: Low**

`NewSession` is a constructor used by runner implementations, not by library users. Exporting it leaks internal wiring (`ResultOrError`, `context.CancelFunc`) into the public API. Make it unexported or move it to an `internal` package.

## 8. `ResultOrError` should not be exported

**Severity: Low**

Same reasoning as above — this is an internal signaling type between the goroutine and `Session.Result()`. It shouldn't be part of the public API surface.

## 9. The example re-parses messages unnecessarily

**Severity: Low**

The example calls `claudecode.Parse(msg.Raw)` even though `msg.Parsed` already contains the parsed `*StreamMessage`. This suggests the API isn't guiding users toward the right pattern. The example should use:

```go
sm, err := claudecode.ParseMessage(msg)
```

or just type-assert `msg.Parsed`. If the example author reached for `Parse(msg.Raw)`, real users will too.

## 10. `DurationMs int64` — consider `time.Duration`

**Severity: Low**

Go code idiomatically uses `time.Duration` rather than raw milliseconds. The `Result.DurationMs` field forces callers to write `time.Duration(result.DurationMs) * time.Millisecond`. Consider:

```go
Duration time.Duration  // instead of DurationMs int64
```

## 11. `CommandBuilder` export is unnecessary

**Severity: Low**

`CommandBuilder` and `WithCommandBuilder` are testing hooks that shouldn't be in the public API. Move them to an `internal` or `_test.go` scope, or use an unexported interface that tests can satisfy.

## 12. Package import path ends in `/go`

**Severity: Low**

The root package is imported as:
```go
import agentrunner "github.com/driangle/agent-runner/go"
```

The `/go` suffix requires an alias since `go` is a keyword. Consider renaming to `agentrunner` as the directory or using a Go module path that doesn't end in a keyword:

```go
// Better
import "github.com/driangle/agent-runner/agentrunner"
```

## Summary

| # | Issue | Severity |
|---|-------|----------|
| 1 | `Start` should return `(*Session, error)` | High |
| 2 | `RunStream` two-channel return is awkward | Medium |
| 3 | `Message.Parsed` is `any` | Medium |
| 4 | `Extra map[any]any` is exported | Medium |
| 5 | Missing `Message` typed accessors | Medium |
| 6 | Boolean options should be parameterless | Low |
| 7 | `NewSession` shouldn't be exported | Low |
| 8 | `ResultOrError` shouldn't be exported | Low |
| 9 | Example re-parses instead of using `Parsed` | Low |
| 10 | `DurationMs` vs `time.Duration` | Low |
| 11 | `CommandBuilder` export is unnecessary | Low |
| 12 | Package path ends in `/go` | Low |

The bones are good. The biggest wins are items 1–5, which affect how every caller interacts with the library.
