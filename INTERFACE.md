# Runner Interface Specification

This document defines the language-agnostic Runner interface that all implementations must follow. Each language library expresses this interface idiomatically, but the conceptual shape is the same.

## Runner

A Runner executes prompts against an AI coding agent and returns results.

```
Runner:
  Run(prompt, options)       → Result
  RunStream(prompt, options) → Stream<Message>
```

- **Run** sends a prompt and blocks until the agent finishes. Returns the final result.
- **RunStream** sends a prompt and yields messages as they arrive. The final message contains the result.

Both methods accept the same options. `Run` is a convenience — it is equivalent to consuming `RunStream` and returning only the final result.

---

## Options

### Common Options

Every runner accepts these options. All are optional — runners provide sensible defaults.

| Field             | Type              | Description                                          |
|-------------------|-------------------|------------------------------------------------------|
| `model`           | `string`          | Model name or alias                                  |
| `systemPrompt`    | `string`          | System prompt override                               |
| `workingDir`      | `string`          | Working directory for the subprocess / agent          |
| `env`             | `map[string]string` | Additional environment variables                   |
| `maxTurns`        | `int`             | Maximum number of agentic turns                      |
| `timeout`         | `duration`        | Overall execution timeout                            |
| `skipPermissions` | `bool`            | Bypass interactive permission prompts                |

### Runner-Specific Options

Each runner extends the common options with its own fields. These are passed through a runner-specific options type that embeds or extends the common options.

#### Claude Code

| Field              | Type       | Description                                      |
|--------------------|------------|--------------------------------------------------|
| `allowedTools`     | `[]string` | Tools the agent may use                          |
| `disallowedTools`  | `[]string` | Tools the agent may not use                      |
| `mcpConfig`        | `string`   | Path to MCP server configuration file            |
| `jsonSchema`       | `string`   | JSON Schema for structured output                |
| `maxBudgetUSD`     | `float64`  | Cost limit                                       |
| `resume`           | `string`   | Session ID to resume                             |
| `continue`         | `bool`     | Continue the most recent session                 |
| `appendSystemPrompt` | `string` | Appended to the default system prompt            |

#### Gemini CLI

| Field              | Type       | Description                                      |
|--------------------|------------|--------------------------------------------------|
| `approvalMode`     | `string`   | `"default"`, `"auto_edit"`, or `"yolo"`          |
| `extensions`       | `[]string` | Extensions to enable                             |
| `mcpServers`       | `[]string` | Allowed MCP server names                         |
| `includeDirectories` | `[]string` | Additional directories to include in workspace |
| `resume`           | `string`   | Session ID to resume (`"latest"` or ID)          |
| `sandbox`          | `bool`     | Run in sandboxed mode                            |

#### Codex CLI

| Field              | Type       | Description                                      |
|--------------------|------------|--------------------------------------------------|
| `sandbox`          | `string`   | `"read-only"`, `"workspace-write"`, `"danger-full-access"` |
| `approval`         | `string`   | `"untrusted"`, `"on-request"`, `"never"`         |
| `outputSchema`     | `string`   | JSON Schema for structured output validation     |
| `images`           | `[]string` | Image file paths for multimodal input            |
| `profile`          | `string`   | Named config profile                             |
| `resume`           | `string`   | Session ID to resume                             |
| `search`           | `bool`     | Enable live web search                           |

#### Ollama

| Field              | Type              | Description                                |
|--------------------|-------------------|--------------------------------------------|
| `baseURL`          | `string`          | API base URL (default `http://localhost:11434`) |
| `format`           | `string`          | `"json"` or a JSON Schema for structured output |
| `keepAlive`        | `duration`        | How long to keep the model loaded in memory |
| `temperature`      | `float64`         | Sampling temperature                       |
| `topK`             | `int`             | Top-K sampling parameter                   |
| `topP`             | `float64`         | Top-P (nucleus) sampling parameter         |
| `seed`             | `int`             | Random seed for reproducibility            |
| `numCtx`           | `int`             | Context window size                        |
| `tools`            | `[]Tool`          | Function definitions for tool calling      |

---

## Result

Returned by `Run` and included in the final `Message` from `RunStream`.

### Common Fields

| Field        | Type     | Description                                         |
|--------------|----------|-----------------------------------------------------|
| `text`       | `string` | Final response text                                 |
| `isError`    | `bool`   | Whether the run ended in error                      |
| `exitCode`   | `int`    | Process exit code (CLI runners) or 0 (API runners)  |
| `usage`      | `Usage`  | Token counts                                        |
| `costUSD`    | `float64`| Estimated cost in USD (0 for local runners)         |
| `durationMs` | `int64`  | Wall-clock duration in milliseconds                 |
| `sessionID`  | `string` | Session identifier for resumption                   |

### Usage

| Field                    | Type  | Description                         |
|--------------------------|-------|-------------------------------------|
| `inputTokens`            | `int` | Prompt / input tokens consumed      |
| `outputTokens`           | `int` | Completion / output tokens generated |
| `cacheCreationInputTokens` | `int` | Tokens written to cache (if supported) |
| `cacheReadInputTokens`   | `int` | Tokens read from cache (if supported) |

Runners that don't support a field leave it at zero.

---

## Message

The unit of streaming output from `RunStream`. Each message has a type and carries either content or metadata.

### Common Envelope

| Field  | Type     | Description                                         |
|--------|----------|-----------------------------------------------------|
| `type` | `string` | Message type (see taxonomy below)                   |
| `raw`  | `bytes`  | Original JSON line / event for runner-specific parsing |

### Message Type Taxonomy

These types are common across all runners. Runner-specific subtypes are accessed through `raw`.

| Type          | Description                                              | When emitted          |
|---------------|----------------------------------------------------------|-----------------------|
| `system`      | Initialization metadata (model, session ID, tools)       | Start of stream       |
| `assistant`   | Model-generated content (text, thinking, tool calls)     | During generation     |
| `tool_use`    | The model is invoking a tool                             | During agentic turns  |
| `tool_result` | Output from a tool execution                             | After tool execution  |
| `result`      | Final result with text, usage, cost, duration            | End of stream         |
| `error`       | Error or warning                                         | Any time              |

### Typed Accessors

Each message type has typed accessor methods/properties for its data, avoiding the need to parse `raw` for common fields:

| Accessor          | Available on   | Returns                                    |
|-------------------|----------------|--------------------------------------------|
| `Text()`          | `assistant`, `result` | The text content                      |
| `Thinking()`      | `assistant`    | Thinking/reasoning content (if present)    |
| `ToolName()`      | `tool_use`     | Name of the tool being called              |
| `ToolInput()`     | `tool_use`     | Tool call arguments (as string or bytes)   |
| `ToolOutput()`    | `tool_result`  | Tool execution output                      |
| `Result()`        | `result`       | The full `Result` struct                   |
| `IsError()`       | `error`, `result` | Whether this is an error                |
| `ErrorMessage()`  | `error`        | Error description                          |

---

## Stream

The return type of `RunStream` — a language-native streaming primitive.

| Language   | Type                       | Notes                              |
|------------|----------------------------|------------------------------------|
| Go         | `iter.Seq2[Message, error]`| Go 1.23+ range-over-func iterator  |
| TypeScript | `AsyncIterable<Message>`   | `for await (const msg of stream)`  |
| Python     | `AsyncIterator[Message]`   | `async for msg in stream`          |
| Java       | `Stream<Message>`          | Or `Flux<Message>` for reactive    |

The stream must be safe to abandon mid-iteration. Abandoning a stream should terminate the underlying process or cancel the request.

---

## Error Handling

Each language should use its native error conventions:

| Language   | Convention                                                    |
|------------|---------------------------------------------------------------|
| Go         | Return `error` as second value; sentinel errors for common cases |
| TypeScript | Throw typed error classes; reject promises                    |
| Python     | Raise typed exceptions                                        |
| Java       | Throw checked/unchecked exceptions                            |

### Common Error Categories

Implementations should distinguish these error categories using language-appropriate mechanisms (sentinel errors, error types, exception classes):

| Category      | Description                                          |
|---------------|------------------------------------------------------|
| `NotFound`    | Runner binary or API endpoint not reachable          |
| `Timeout`     | Execution exceeded the timeout                       |
| `NonZeroExit` | CLI process exited with non-zero code                |
| `ParseError`  | Failed to parse runner output                        |
| `Cancelled`   | Execution was cancelled by the caller                |

---

## Language-Idiomatic Expression

### Go

```go
type Runner interface {
    Run(ctx context.Context, prompt string, opts ...Option) (*Result, error)
    RunStream(ctx context.Context, prompt string, opts ...Option) iter.Seq2[Message, error]
}

// Options via functional options pattern
type Option func(*Options)

func WithModel(model string) Option
func WithSystemPrompt(prompt string) Option
func WithWorkingDir(dir string) Option
func WithTimeout(d time.Duration) Option
// ... etc

// Runner-specific options (e.g. for Claude)
func WithAllowedTools(tools ...string) Option
func WithMCPConfig(path string) Option
```

### TypeScript

```typescript
interface Runner {
  run(prompt: string, options?: RunOptions): Promise<Result>;
  runStream(prompt: string, options?: RunOptions): AsyncIterable<Message>;
}

// Options as a typed object with optional fields
interface RunOptions {
  model?: string;
  systemPrompt?: string;
  workingDir?: string;
  timeout?: number;
  // ...common fields
}

// Runner-specific options extend the base
interface ClaudeRunOptions extends RunOptions {
  allowedTools?: string[];
  mcpConfig?: string;
  // ...
}
```

### Python

```python
class Runner(Protocol):
    async def run(self, prompt: str, **options: Unpack[RunOptions]) -> Result: ...
    def run_stream(self, prompt: str, **options: Unpack[RunOptions]) -> AsyncIterator[Message]: ...

@dataclass
class RunOptions:
    model: str | None = None
    system_prompt: str | None = None
    working_dir: str | None = None
    timeout: float | None = None
    # ...common fields

# Runner-specific options extend the base
@dataclass
class ClaudeRunOptions(RunOptions):
    allowed_tools: list[str] | None = None
    mcp_config: str | None = None
    # ...
```

### Java

```java
public interface Runner {
    Result run(String prompt, RunOptions options);
    Stream<Message> runStream(String prompt, RunOptions options);
}

// Options via builder pattern
RunOptions options = RunOptions.builder()
    .model("claude-sonnet-4-20250514")
    .systemPrompt("You are a helpful assistant.")
    .workingDir("/path/to/project")
    .timeout(Duration.ofMinutes(5))
    .build();

// Runner-specific options extend the base
ClaudeRunOptions options = ClaudeRunOptions.builder()
    .model("claude-sonnet-4-20250514")
    .allowedTools(List.of("Read", "Write"))
    .build();
```

---

## Runner Registration

Each language library provides factory functions or constructors for creating runners:

```
NewClaudeRunner(binaryPath?) → Runner
NewGeminiRunner(binaryPath?) → Runner
NewCodexRunner(binaryPath?)  → Runner
NewOllamaRunner(baseURL?)    → Runner
```

The binary path / base URL defaults to the standard location but can be overridden for testing or custom installations.
