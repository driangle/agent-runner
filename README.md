# agentrunner

Language-native libraries for programmatically invoking AI coding agent CLIs.

## Supported Runners

| Runner | CLI | Status |
|--------|-----|--------|
| Claude Code | `claude` | Planned |
| Gemini CLI | `gemini` | Planned |
| Codex CLI | `codex` | Planned |
| Ollama (local) | `ollama` | Planned |

## Libraries

| Language   | Path        | Package |
|------------|-------------|---------|
| TypeScript | [`ts/`](ts/)       | `agentrunner` |
| Go         | [`go/`](go/)       | `agentrunner` |
| Python     | [`python/`](python/) | `agentrunner` |
| Java       | [`java/`](java/)     | `agentrunner` |

## Overview

Each library implements a common `Runner` interface across all supported AI agent CLIs. This lets you swap between Claude Code, Gemini, and Codex with a consistent API for process management, streaming output, and result parsing.
