---
title: "Define common language-agnostic Runner interface"
id: "01kkx4qbr"
status: completed
priority: critical
type: feature
tags: ["architecture"]
created: "2026-03-17"
phase: foundation
---

# Define common language-agnostic Runner interface

## Objective

Define the conceptual Runner interface that all language implementations and all CLI runners (Claude Code, Gemini, Codex) must follow. This is a language-agnostic specification — each language library will express it idiomatically. The goal is that callers can swap runners without changing their code.

## Interface Shape

```
Runner:
  Run(prompt, options) → Result
  RunStream(prompt, options) → Stream<Message>

Options (common):
  workingDir    string       — subprocess working directory
  env           map          — environment variables
  model         string       — model name/alias
  systemPrompt  string       — system prompt override
  maxTurns      int          — limit agentic turns
  timeout       duration     — overall timeout
  skipPermissions bool       — bypass permission prompts

Options (runner-specific):
  Each runner extends Options with CLI-specific fields
  (e.g. Claude: allowedTools, mcpConfig, jsonSchema, resume)

Result (common):
  text          string       — final response text
  isError       bool         — whether the run failed
  usage         Usage        — token counts (input, output)
  costUSD       float64      — total cost
  durationMs    int64        — wall-clock duration
  sessionID     string       — session identifier

Message (common):
  type          string       — message type (system, assistant, result, etc.)
  raw           bytes        — original JSON line for runner-specific parsing

Stream<Message>:
  Language-native streaming primitive:
    Go:         <-chan Message
    TypeScript: AsyncIterable<Message>
    Python:     AsyncIterator[Message]
    Java:       Stream<Message> or Flux<Message>
```

## Tasks

- [x] Write the interface specification as a markdown document in the repo root (`INTERFACE.md`)
- [x] Define common Option fields vs runner-specific extension points
- [x] Define common Result fields vs runner-specific extension points
- [x] Define common Message type taxonomy (what's shared, what's runner-specific)
- [x] Document how each language should express the interface idiomatically
- [x] Review against all 4 target runners (Claude Code, Gemini, Codex, Ollama) to ensure the abstraction works

## Acceptance Criteria

- Interface is documented in `INTERFACE.md`
- Common fields cover the intersection of all 4 runners
- Runner-specific extensions are clearly separated
- The interface is implementable in all 4 languages without awkward workarounds
- Each language has guidance on idiomatic expression (e.g. Go interfaces, TS generics, Python protocols)
