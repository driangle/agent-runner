# agentrunner

Language-native libraries for programmatically invoking AI coding agent CLIs.

> **Note:** This project is under active development and has not been released yet. APIs may change without notice.

## Supported Runners

| Runner | Go | TypeScript | Python | Java |
|--------|----|------------|--------|------|
| Claude Code (`claude`) | :white_check_mark: | :white_check_mark: | :white_check_mark: | Planned |
| Gemini CLI (`gemini`) | Planned | Planned | Planned | Planned |
| Codex CLI (`codex`) | Planned | Planned | Planned | Planned |
| Ollama (`ollama`) | :white_check_mark: | :white_check_mark: | Planned | Planned |

## Libraries

| Language   | Path        | Package |
|------------|-------------|---------|
| Go         | [`go/`](go/)       | `agentrunner` |
| TypeScript | [`ts/`](ts/)       | `agentrunner` |
| Python     | [`python/`](python/) | `agentrunner` |
| Java       | [`java/`](java/)     | `agentrunner` |

## Interface

Each library implements a common Runner interface: `Run` returns a result, `Start`/`RunStream` streams messages. Options and results share the same shape across languages.

### Go

```go
runner := claudecode.NewRunner()

// Simple run
result, err := runner.Run(ctx, "explain this project")
fmt.Println(result.Text, result.CostUSD)

// Stream messages
session, err := runner.Start(ctx, "refactor main.go",
    agentrunner.WithModel("claude-sonnet-4-20250514"),
    claudecode.WithMaxBudgetUSD(0.50),
)
for msg := range session.Messages {
    fmt.Println(msg.Type, msg.Text())
}
result, err = session.Result()
```

### TypeScript

```typescript
const runner = createClaudeRunner();

// Simple run
const result = await runner.run("explain this project");
console.log(result.text, result.costUSD);

// Stream messages
for await (const msg of runner.runStream("refactor main.ts", {
    model: "claude-sonnet-4-20250514",
    maxBudgetUSD: 0.50,
})) {
    console.log(msg.type, msg.data);
}
```

### Python

```python
runner = ClaudeRunner()

# Simple run
result = await runner.run("explain this project")
print(result.text, result.cost_usd)

# Stream messages
async for msg in runner.run_stream("refactor main.py", ClaudeRunOptions(
    model="claude-sonnet-4-20250514",
    max_budget_usd=0.50,
)):
    print(msg.type, msg.text)
```

## Overview

Each library implements a common `Runner` interface across all supported AI agent CLIs. This lets you swap between Claude Code, Gemini, and Codex with a consistent API for process management, streaming output, and result parsing.
