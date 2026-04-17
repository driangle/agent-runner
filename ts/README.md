# agentrunner (TypeScript)

TypeScript library for programmatically invoking AI coding agents. Part of the [agentrunner](../) monorepo.

## Supported Runners

| Runner      | CLI Version | Status |
| ----------- | ----------- | ------ |
| Claude Code | >= 1.0.12   | ✅     |
| Ollama      | —           | ✅     |

## Installation

```bash
npm install @driangle/agentrunner
```

## Quick Start

```typescript
import { createClaudeRunner } from "@driangle/agentrunner/claudecode";

const runner = createClaudeRunner();

// Simple run
const result = await runner.run("What files are in this directory?", {
  workingDir: "/path/to/project",
  skipPermissions: true,
});
console.log(result.text);

// Streaming
for await (const message of runner.runStream("Explain this codebase")) {
  console.log(message.type, message.raw);
}
```

## API

### `createClaudeRunner(config?)`

Creates a runner for the Claude Code CLI.

**Config options (`ClaudeRunnerConfig`):**

| Field    | Type      | Default    | Description                         |
| -------- | --------- | ---------- | ----------------------------------- |
| `binary` | `string`  | `"claude"` | CLI binary name or path             |
| `spawn`  | `SpawnFn` | —          | Custom spawn function (for testing) |
| `logger` | `Logger`  | —          | Logger for debug output (opt-in)    |

### `createOllamaRunner(config?)`

Creates a runner for the Ollama HTTP API.

**Config options (`OllamaRunnerConfig`):**

| Field     | Type      | Default                    | Description                         |
| --------- | --------- | -------------------------- | ----------------------------------- |
| `baseURL` | `string`  | `"http://localhost:11434"` | Ollama API base URL                 |
| `fetch`   | `FetchFn` | —                          | Custom fetch function (for testing) |
| `logger`  | `Logger`  | —                          | Logger for debug output (opt-in)    |

### `runner.run(prompt, options?)`

Execute a prompt and return the final `Result`.

### `runner.runStream(prompt, options?)`

Execute a prompt and stream messages as they arrive. Returns `AsyncIterable<Message>`.

### `runner.start(prompt, options?)`

Launch an agent process and return a `Session` for full lifecycle control.

### Session

| Attribute  | Type                     | Description                           |
| ---------- | ------------------------ | ------------------------------------- |
| `messages` | `AsyncIterable<Message>` | Iterate messages as they arrive       |
| `result`   | `Promise<Result>`        | Resolves when the agent finishes      |
| `abort()`  | —                        | Terminate the agent process           |
| `send()`   | —                        | Reserved (throws `NotSupportedError`) |

### Run Options

Common options (all runners):

| Field                | Type                    | Description                       |
| -------------------- | ----------------------- | --------------------------------- |
| `model`              | `string`                | Model name or alias               |
| `systemPrompt`       | `string`                | System prompt override            |
| `appendSystemPrompt` | `string`                | Appended to default system prompt |
| `workingDir`         | `string`                | Working directory for subprocess  |
| `env`                | `Record<string,string>` | Additional environment variables  |
| `maxTurns`           | `number`                | Maximum agentic turns             |
| `timeout`            | `number`                | Timeout in milliseconds           |
| `signal`             | `AbortSignal`           | Cancellation signal               |
| `skipPermissions`    | `boolean`               | Skip permission prompts           |

Claude-specific options (`ClaudeRunOptions` extends `RunOptions`):

| Field                    | Type       | Description                         |
| ------------------------ | ---------- | ----------------------------------- |
| `allowedTools`           | `string[]` | Tools the agent may use             |
| `disallowedTools`        | `string[]` | Tools the agent may not use         |
| `mcpConfig`              | `string`   | Path to MCP server config           |
| `jsonSchema`             | `string`   | JSON Schema for structured output   |
| `maxBudgetUSD`           | `number`   | Cost limit in USD                   |
| `resume`                 | `string`   | Session ID to resume                |
| `continueSession`        | `boolean`  | Continue most recent session        |
| `sessionId`              | `string`   | Specific session ID                 |
| `includePartialMessages` | `boolean`  | Stream partial/incremental messages |
| `onMessage`              | `function` | Callback for each streamed message  |

Ollama-specific options (`OllamaRunOptions` extends `RunOptions`):

| Field         | Type       | Description                        |
| ------------- | ---------- | ---------------------------------- |
| `temperature` | `number`   | Sampling temperature               |
| `numCtx`      | `number`   | Context window size                |
| `numPredict`  | `number`   | Maximum tokens to generate         |
| `seed`        | `number`   | Random seed for reproducibility    |
| `stop`        | `string[]` | Stop sequences                     |
| `topK`        | `number`   | Top-K sampling parameter           |
| `topP`        | `number`   | Top-P (nucleus) sampling parameter |
| `minP`        | `number`   | Min-P sampling parameter           |
| `format`      | `string`   | `"json"` or a JSON Schema          |
| `keepAlive`   | `string`   | How long to keep model loaded      |
| `think`       | `boolean`  | Enable thinking/reasoning          |
| `onMessage`   | `function` | Callback for each streamed message |

### Result

| Field        | Type      | Description                    |
| ------------ | --------- | ------------------------------ |
| `text`       | `string`  | Final response text            |
| `isError`    | `boolean` | Whether the run ended in error |
| `exitCode`   | `number`  | Process exit code              |
| `usage`      | `Usage`   | Token counts                   |
| `costUSD`    | `number`  | Estimated cost in USD          |
| `durationMs` | `number`  | Wall-clock duration in ms      |
| `sessionId`  | `string`  | Session ID for resumption      |

### Error Classes

All errors extend `RunnerError`:

- `NotFoundError` — CLI binary not found
- `TimeoutError` — execution timed out
- `NonZeroExitError` — CLI exited with non-zero code (has `exitCode`)
- `ParseError` — failed to parse CLI output
- `CancelledError` — execution cancelled via AbortSignal
- `HttpError` — HTTP request failed (has `statusCode`)
- `NotSupportedError` — operation not supported
- `NoResultError` — stream ended without a result message

```typescript
import { TimeoutError } from "@driangle/agentrunner";

try {
  await runner.run("complex task", { timeout: 30_000 });
} catch (err) {
  if (err instanceof TimeoutError) {
    console.log("Timed out!");
  }
}
```

## Exports

The package uses subpath exports:

```typescript
import { ... } from "@driangle/agentrunner";           // common types, errors
import { ... } from "@driangle/agentrunner/claudecode"; // Claude Code runner
import { ... } from "@driangle/agentrunner/ollama";     // Ollama runner
```

## Development

```bash
npm install    # install dependencies
npm run build  # compile TypeScript
npm run lint   # type-check only
npm test       # run tests
```

Or from the repo root:

```bash
make check-ts  # build + lint + test
make check     # all libraries
```
