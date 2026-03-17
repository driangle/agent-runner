---
title: "Write tests and add Go package README"
id: "01kkx436c"
status: pending
priority: medium
type: chore
tags: ["go"]
created: "2026-03-17"
dependencies: ["01kkx4368", "01kkx4369"]
parent: 01kkx4yva
---

# Write tests and add Go package README

## Description

Ensure comprehensive test coverage and add a package-level README for the Go library.

## Tasks

- [ ] Add integration-style tests using `CommandBuilder` with mock subprocess
- [ ] Add table-driven tests for CLI argument building from all option combinations
- [ ] Add parser tests with a real session fixture (JSONL file from a `claude -p --output-format stream-json` invocation)
- [ ] Ensure `go test ./...` passes with no race conditions (`-race`)
- [ ] Add `go/README.md` with installation, quick start, and API overview
- [ ] Add usage examples in README (basic run, streaming, session resume)
