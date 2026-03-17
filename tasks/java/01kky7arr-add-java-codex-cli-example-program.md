---
title: "Add Java Codex CLI example program"
id: "01kky7arr"
status: pending
priority: medium
type: feature
tags: ["java", "codex", "example"]
dependencies: ["01kkx3f6m"]
created: "2026-03-17"
---

# Add Java Codex CLI example program

## Objective

Add a working example program that demonstrates how to use the Java Codex CLI runner. The example should show both `run` and `runStream` usage with CompletableFuture.

## Tasks

- [ ] Create `examples/java/codex/src/main/java/Example.java` with a working example
- [ ] Include `run` and `runStream` usage with CompletableFuture
- [ ] Add a `pom.xml` for the example

## Acceptance Criteria

- Example compiles and runs against a local Codex CLI installation
- Example demonstrates both synchronous and streaming usage
- Example is self-contained with its own `pom.xml`
