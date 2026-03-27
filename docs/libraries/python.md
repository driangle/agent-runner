# Python Library

The Python library lives under `python/` and uses modern Python conventions (dataclasses, async/await, type hints).

## Installation

```sh
pip install agentrunner
```

Requires Python >= 3.11.

## Creating a Runner

### Claude Code

```python
from agentrunner import ClaudeRunner

runner = ClaudeRunner()

# With options
runner = ClaudeRunner(
    binary="/usr/local/bin/claude",
    logger=logging.getLogger("agentrunner"),
)
```

### Ollama

```python
from agentrunner import OllamaRunner

runner = OllamaRunner()

# With options
runner = OllamaRunner(
    base_url="http://localhost:11434",
    logger=logging.getLogger("agentrunner"),
)
```

## Running a Prompt

```python
from agentrunner import ClaudeRunner, ClaudeRunOptions

runner = ClaudeRunner()
result = await runner.run("What is 2+2?", ClaudeRunOptions(
    model="claude-sonnet-4-20250514",
    timeout=30.0,
))

print(result.text)
print(f"Cost: ${result.cost_usd:.4f}")
print(f"Tokens: {result.usage.input_tokens} in, {result.usage.output_tokens} out")
```

## Streaming

### Using start (full session control)

```python
session = runner.start("Explain this codebase", ClaudeRunOptions(
    working_dir="/path/to/project",
))

async for msg in session:
    if msg.type == "assistant" and msg.text:
        print(msg.text, end="")
    elif msg.type == "tool_use":
        print(f"\n[tool: {msg.tool_name}]")
    elif msg.type == "tool_result":
        print(f"[result: {msg.tool_output}]")

result = await session.result
```

### Using run_stream (convenience wrapper)

```python
async for msg in runner.run_stream("Explain this codebase"):
    if msg.text:
        print(msg.text, end="")
```

## Common Options

```python
from agentrunner import ClaudeRunOptions

options = ClaudeRunOptions(
    model="claude-sonnet-4-20250514",
    system_prompt="You are a helpful assistant.",
    working_dir="/path/to/project",
    env={"DEBUG": "1"},
    max_turns=10,
    timeout=300.0,
)
```

## Claude Code Options

```python
from agentrunner import ClaudeRunOptions

options = ClaudeRunOptions(
    allowed_tools=["Read", "Write", "Bash"],
    disallowed_tools=["WebSearch"],
    mcp_config="/path/to/mcp.json",
    json_schema='{"type": "object", ...}',
    max_budget_usd=1.0,
    resume="session-id",
    continue_session=True,
    include_partial_messages=True,
)
```

## Ollama Options

```python
from agentrunner import OllamaRunOptions

options = OllamaRunOptions(
    temperature=0.7,
    num_ctx=4096,
    num_predict=256,
    seed=42,
    stop=["END"],
    top_k=40,
    top_p=0.9,
    format="json",
    keep_alive="5m",
    think=True,
)
```

## Session Resume

```python
# First run — capture the session ID
result = await runner.run("Start a new task")
session_id = result.session_id

# Later — resume the session
from agentrunner import ClaudeRunOptions

result = await runner.run(
    "Continue where you left off",
    ClaudeRunOptions(resume=session_id),
)
```

## Error Handling

Errors are raised as typed exceptions:

```python
from agentrunner import (
    NotFoundError,
    TimeoutError,
    NonZeroExitError,
    CancelledError,
    ParseError,
)

try:
    result = await runner.run("prompt")
except NotFoundError:
    print("CLI binary not found")
except TimeoutError:
    print("Execution timed out")
except NonZeroExitError as e:
    print(f"CLI exited with code {e.exit_code}")
except CancelledError:
    print("Cancelled")
```

## Message Accessors

Messages expose typed properties:

```python
msg.text           # text content
msg.thinking       # reasoning content
msg.tool_name      # tool being called
msg.tool_input     # tool arguments
msg.tool_output    # tool result
msg.is_error       # is this an error?
msg.error_message  # error description
```

## Logging

Use the standard `logging` module:

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("agentrunner")

runner = ClaudeRunner(logger=logger)
```
