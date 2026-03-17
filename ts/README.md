# agentrunner (TypeScript)

TypeScript library for programmatically invoking AI coding agents. Part of the [agentrunner](../) monorepo.

## Supported Runners

| Runner | CLI | Supported Version |
|--------|-----|-------------------|
| Claude Code | `claude` | >= 1.0.12 |

## Installation

```bash
npm install agentrunner
```

## Quick Start

```typescript
import { ClaudeCodeRunner } from "agentrunner/claudecode";

const runner = new ClaudeCodeRunner();

// Blocking execution
const result = await runner.run("Explain this codebase", {
  workingDir: "/path/to/project",
  skipPermissions: true,
});
console.log(result.text);
console.log(`Cost: $${result.costUSD}`);

// Streaming
for await (const message of runner.runStream("Write a test for utils.ts")) {
  console.log(`[${message.type}]`, message.raw);
}
```

## API

### Runner Interface

All runners implement the common `Runner` interface:

```typescript
interface Runner {
  run(prompt: string, options?: RunOptions): Promise<Result>;
  runStream(prompt: string, options?: RunOptions): AsyncIterable<Message>;
}
```

### Common Options

```typescript
interface RunOptions {
  model?: string;             // Model name or alias
  systemPrompt?: string;      // System prompt override
  appendSystemPrompt?: string; // Appended to default system prompt
  workingDir?: string;        // Working directory for subprocess
  env?: Record<string, string>; // Additional environment variables
  maxTurns?: number;          // Maximum agentic turns
  timeout?: number;           // Timeout in milliseconds
  skipPermissions?: boolean;  // Bypass permission prompts
}
```

### Claude Code Options

```typescript
interface ClaudeCodeRunOptions extends RunOptions {
  allowedTools?: string[];    // Tools the agent may use
  disallowedTools?: string[]; // Tools the agent may not use
  mcpConfig?: string;         // Path to MCP config file
  jsonSchema?: string;        // JSON Schema for structured output
  maxBudgetUSD?: number;      // Cost limit
  resume?: string;            // Session ID to resume
  continue?: boolean;         // Continue most recent session
  sessionID?: string;         // Specific session ID
  onMessage?: (msg: Message) => void; // Streaming callback
}
```

### Result

```typescript
interface Result {
  text: string;        // Final response text
  isError: boolean;    // Whether the run ended in error
  exitCode: number;    // Process exit code
  usage: Usage;        // Token counts
  costUSD: number;     // Estimated cost in USD
  durationMs: number;  // Wall-clock duration in milliseconds
  sessionID: string;   // Session ID for resumption
}
```

### Session Management

```typescript
// Resume a previous session
const result = await runner.run("Continue from where we left off", {
  resume: "session-id-from-previous-run",
});

// Continue the most recent session
const result = await runner.run("What were we working on?", {
  continue: true,
});
```

### Error Handling

```typescript
import { RunnerError } from "agentrunner";

try {
  const result = await runner.run("do something");
} catch (err) {
  if (err instanceof RunnerError) {
    switch (err.code) {
      case "not_found":    // CLI binary not found
      case "timeout":      // Execution timed out
      case "non_zero_exit": // CLI exited with error
      case "no_result":    // No result in output
      case "cancelled":    // Execution was cancelled
    }
  }
}
```

### Parsing Raw Messages

Access Claude Code-specific message details by parsing the raw JSON:

```typescript
import { parse } from "agentrunner/claudecode";

for await (const message of runner.runStream("do something")) {
  const parsed = parse(message.raw);
  if (parsed.type === "assistant" && parsed.content) {
    for (const block of parsed.content) {
      if (block.type === "text") console.log(block.text);
      if (block.type === "thinking") console.log("[thinking]", block.thinking);
      if (block.type === "tool_use") console.log("[tool]", block.name);
    }
  }
}
```

## Development

```bash
npm run build    # Compile TypeScript
npm run lint     # Type-check without emitting
npm test         # Run tests
```
