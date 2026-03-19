---
title: "Add TypeScript Ollama example program"
id: "01kky7aqy"
status: completed
priority: medium
type: feature
tags: ["typescript", "ollama", "example"]
dependencies: ["01kkx7v98"]
created: "2026-03-17"
---

# Add TypeScript Ollama example program

## Objective

Add a working example program that demonstrates how to use the TypeScript Ollama runner. The example should show both `run` and `runStream` usage with async/await and async iterators.

## Tasks

- [x] Create `examples/ts/ollama/main.ts` with a working example
- [x] Include `run` and `runStream` usage with async/await and async iterators
- [x] Add a `package.json` and `tsconfig.json` for the example

## Acceptance Criteria

- Example compiles and runs against a local Ollama installation
- Example demonstrates both synchronous and streaming usage
- Example is self-contained with its own `package.json` and `tsconfig.json`
