---
title: "Add TypeScript Gemini CLI example program"
id: "01kky7aqq"
status: pending
priority: medium
type: feature
tags: ["typescript", "gemini", "example"]
dependencies: ["01kkx7vaa"]
created: "2026-03-17"
---

# Add TypeScript Gemini CLI example program

## Objective

Add a working example program that demonstrates how to use the TypeScript Gemini CLI runner. The example should show both `run` and `runStream` usage with async/await and async iterators.

## Tasks

- [ ] Create `examples/ts/gemini/main.ts` with a working example
- [ ] Include `run` and `runStream` usage with async/await and async iterators
- [ ] Add a `package.json` and `tsconfig.json` for the example

## Acceptance Criteria

- Example compiles and runs against a local Gemini CLI installation
- Example demonstrates both synchronous and streaming usage
- Example is self-contained with its own `package.json` and `tsconfig.json`
