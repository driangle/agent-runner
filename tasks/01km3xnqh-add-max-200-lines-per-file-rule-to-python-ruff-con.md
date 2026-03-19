---
title: "Add max 200 lines per file rule to Python Ruff config"
id: "01km3xnqh"
status: pending
priority: medium
type: chore
tags: ["python", "linting"]
created: "2026-03-19"
---

# Add max 200 lines per file rule to Python Ruff config

## Objective

Add a max 200 lines per file rule to the existing Ruff configuration in the Python library (`python/`). Ruff is already configured in `pyproject.toml` — this task adds the missing file-length enforcement to match the TypeScript ESLint config.

## Tasks

- [ ] Enable Ruff's `pylint` rule set (specifically `PLR0915` or the appropriate max-lines rule) in `pyproject.toml`
- [ ] Configure the max lines per file limit to 200 lines
- [ ] Fix any existing Python source files that exceed 200 lines
- [ ] Verify `make lint-python` and `make check` pass

## Acceptance Criteria

- `pyproject.toml` includes a Ruff rule enforcing a max of 200 lines per file
- All existing Python source files are at or under 200 lines
- `make check` passes with no lint errors
