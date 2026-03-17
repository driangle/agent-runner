---
title: "Add Java Ollama example program"
id: "01kky7arw"
status: pending
priority: medium
type: feature
tags: ["java", "ollama", "example"]
dependencies: ["01kkx3f6m"]
created: "2026-03-17"
---

# Add Java Ollama example program

## Objective

Add a working example program that demonstrates how to use the Java Ollama runner. The example should show both `run` and `runStream` usage with CompletableFuture.

## Tasks

- [ ] Create `examples/java/ollama/src/main/java/Example.java` with a working example
- [ ] Include `run` and `runStream` usage with CompletableFuture
- [ ] Add a `pom.xml` for the example

## Acceptance Criteria

- Example compiles and runs against a local Ollama installation
- Example demonstrates both synchronous and streaming usage
- Example is self-contained with its own `pom.xml`
