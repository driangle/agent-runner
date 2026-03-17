# agentrunner

Monorepo of language-native libraries for programmatically invoking AI coding agents (Claude Code, Gemini CLI, Codex CLI, Ollama).

## Project Structure

```
INTERFACE.md  # Language-agnostic Runner interface specification
ts/           # TypeScript library
go/           # Go library
python/       # Python library
java/         # Java library
tasks/        # taskmd task files
```

## Design Principles

### Common Runner interface

All libraries implement a shared, language-agnostic Runner interface. The interface should feel native in each language but follow the same conceptual shape:

- **Run(prompt, options) → Result** — execute a prompt and return the final result
- **RunStream(prompt, options) → Stream<Message>** — execute and stream messages as they arrive
- **Options** — common options (model, system prompt, working directory, timeout, env) plus runner-specific options
- **Result** — common result fields (text, usage, cost, duration, session ID, is_error) plus runner-specific fields
- **Message** — common message envelope (type, content) with runner-specific subtypes

Each runner (Claude Code, Gemini, Codex) implements this interface, so callers can swap runners without changing their code.

### Thin and transparent

Each library should be as thin as possible — a minimal layer over the underlying CLI or API. Avoid inventing abstractions, hiding behavior, or adding logic that isn't directly required by the interface. Callers should be able to predict what the library does by knowing what the underlying tool does. Pass options through, surface errors directly, and keep the code auditable at a glance. The goal is a convenience wrapper, not a framework.

### Language-native conventions

Each library must feel native to its language. Follow the idiomatic structure, naming, error handling, packaging, and testing conventions of that language. Do not impose patterns from one language onto another.

- **Go**: modules, exported types, `error` returns, `context.Context`, table-driven tests
- **TypeScript**: npm package, async iterators, typed interfaces, Jest/Vitest tests
- **Python**: pyproject.toml, dataclasses/Pydantic, async/await, pytest
- **Java**: Maven/Gradle, builder pattern, CompletableFuture, JUnit tests

### Supported runners

#### Claude Code CLI (`claude`)

Interacts via `claude -p` (print/non-interactive mode) with `--output-format stream-json`. Key CLI flags:

- `--print` / `-p` — non-interactive mode
- `--output-format stream-json` — newline-delimited JSON events
- `--output-format json` — single JSON result
- `--model` — model selection
- `--system-prompt` / `--append-system-prompt` — prompt customization
- `--allowedTools` / `--disallowedTools` — tool permissions
- `--dangerously-skip-permissions` — skip permission prompts
- `--max-turns` — limit agentic turns
- `--max-budget-usd` — cost limit
- `--continue` / `--resume` — session management
- `--mcp-config` — MCP server configuration
- `--json-schema` — structured output

Stream-JSON message types: `system` (init), `assistant` (text/thinking/tool_use), `user` (tool results), `result` (success/error with cost/usage/duration), `stream_event` (raw API events), `rate_limit_event`.

#### Gemini CLI (`gemini`)

TBD — research CLI flags and output format.

#### Codex CLI (`codex`)

TBD — research CLI flags and output format.

#### Ollama (local, `ollama`)

Local runner that talks to the Ollama HTTP API rather than shelling out to a CLI. Enables fully offline agent execution with locally-hosted models. TBD — research API endpoints and streaming format.

### Reference implementations (Go, Claude Code)

Three prior implementations exist as reference (none are perfect):

1. **doer** (`/Users/driangle/workplace/gg/doer/doer-1/apps/cli/internal/agent/claudecode/`)
   - Strengths: clean type system for stream-json parsing (`fmt/types.go`, `fmt/parser.go`), good test coverage, formatter for human-readable output
   - Weaknesses: tightly coupled to a specific `agent.Agent` interface, not a standalone library

2. **pons** (`/Users/driangle/workplace/gg/pons/pons-1/apps/eval/internal/runner/`)
   - Strengths: simple and focused, clean `Run()` function, good event collection
   - Weaknesses: minimal type safety for events, no streaming callback, eval-specific

3. **modpol** (`/Users/driangle/workplace/gg/modpol/modpol-1/apps/cli/internal/claude/`)
   - Strengths: sentinel errors, `CommandBuilder` for testability, `ReadStreamResult` helper, progress hooks
   - Weaknesses: limited event type coverage, app-specific concerns mixed in
