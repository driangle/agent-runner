---
title: "Add Python Gemini CLI example program"
id: "01kky7ar5"
status: pending
priority: medium
type: feature
tags: ["python", "gemini", "example"]
dependencies: ["01kkx3f67"]
created: "2026-03-17"
---

# Add Python Gemini CLI example program

## Objective

Add a working example program that demonstrates how to use the Python Gemini CLI runner. The example should show both `run` and `run_stream` usage with asyncio.

## Tasks

- [ ] Create `examples/python/gemini/main.py` with a working example
- [ ] Include `run` and `run_stream` usage with asyncio
- [ ] Add a `pyproject.toml` for the example

## Acceptance Criteria

- Example runs against a local Gemini CLI installation
- Example demonstrates both synchronous and streaming usage
- Example is self-contained with its own `pyproject.toml`
