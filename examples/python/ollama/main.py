#!/usr/bin/env python3
"""Example: using the agentrunner Python library to invoke Ollama models.

Covers basic run, streaming, thinking models, and the Session object pattern.

Prerequisites:
  - Ollama installed and running: https://ollama.com
  - A model pulled: ollama pull llama3.2

Run:
  cd examples/python/ollama
  pip install -e .
  python main.py --model llama3.2
  python main.py --model codellama --base-url http://localhost:11434
"""

import argparse
import asyncio
import logging
import sys

from agentrunner import OllamaRunner, OllamaRunnerConfig, OllamaRunOptions
from agentrunner.ollama import message_text, message_thinking


async def example_simple_run(runner: OllamaRunner, model: str) -> None:
    """Send a single prompt and print the result."""
    prompt = "What is 2+2? Reply with just the number."
    print(f"Prompt:   {prompt}")

    result = await runner.run(prompt, OllamaRunOptions(model=model, timeout=300))

    print(f"Response: {result.text}")
    print(f"Cost:     ${result.cost_usd:.4f} (always 0 for local models)")
    print(f"Tokens:   {result.usage.input_tokens} in / {result.usage.output_tokens} out")
    print(f"Duration: {result.duration_ms:.0f}ms")
    print(f"Error:    {result.is_error}")


async def example_streaming(runner: OllamaRunner, model: str) -> None:
    """Use run_stream to print tokens as they arrive."""
    prompt = "List 3 fun facts about Python. Be brief."
    print(f"Prompt: {prompt}")
    print("---")

    session = await runner.run_stream(
        prompt,
        OllamaRunOptions(
            model=model,
            timeout=300,
            system_prompt="You are a helpful assistant. Keep answers concise.",
            temperature=0.7,
        ),
    )

    async for msg in session:
        if msg.type == "assistant":
            text = message_text(msg)
            if text:
                sys.stdout.write(text)
                sys.stdout.flush()
        elif msg.type == "result":
            print("\n---")

    result = await session.result
    print(f"Duration: {result.duration_ms:.0f}ms")
    print(f"Tokens:   {result.usage.input_tokens} in / {result.usage.output_tokens} out")


async def example_thinking(runner: OllamaRunner, model: str) -> None:
    """Demonstrate streaming with a thinking model (e.g. qwen3)."""
    prompt = "How many r's are in the word strawberry?"
    print(f"Prompt: {prompt}")
    print("---")

    session = await runner.run_stream(
        prompt, OllamaRunOptions(model=model, timeout=300, think=True)
    )

    async for msg in session:
        if msg.type != "assistant":
            continue

        thinking = message_thinking(msg)
        if thinking:
            # Dim text for thinking output.
            sys.stdout.write(f"\033[2m{thinking}\033[0m")
            sys.stdout.flush()
        text = message_text(msg)
        if text:
            sys.stdout.write(text)
            sys.stdout.flush()

    print("\n---")


async def example_session(runner: OllamaRunner, model: str) -> None:
    """Demonstrate the Session object pattern with full lifecycle control."""
    prompt = "What is the capital of France? Reply with just the city name."
    print(f"Prompt: {prompt}")

    session = runner.start(prompt, OllamaRunOptions(model=model, timeout=300))

    count = 0
    async for msg in session:
        count += 1
        if msg.type == "assistant":
            text = message_text(msg)
            if text:
                sys.stdout.write(text)
                sys.stdout.flush()

    print()
    print(f"Received {count} messages")

    result = await session.result
    print(f"Response: {result.text}")
    print(f"Duration: {result.duration_ms:.0f}ms")


async def main() -> None:
    parser = argparse.ArgumentParser(description="agentrunner Ollama example")
    parser.add_argument("--model", required=True, help="Ollama model name (e.g. llama3.2)")
    parser.add_argument(
        "--base-url", default="http://localhost:11434", help="Ollama API base URL"
    )
    parser.add_argument("--verbose", action="store_true", help="enable debug logging")
    args = parser.parse_args()

    logger = None
    if args.verbose:
        logging.basicConfig(level=logging.DEBUG, stream=sys.stderr)
        logger = logging.getLogger("agentrunner.ollama")

    runner = OllamaRunner(config=OllamaRunnerConfig(base_url=args.base_url, logger=logger))

    print("=== Example 1: Simple Run ===")
    await example_simple_run(runner, args.model)

    print("\n=== Example 2: Streaming ===")
    await example_streaming(runner, args.model)

    print("\n=== Example 3: Thinking Model ===")
    await example_thinking(runner, args.model)

    print("\n=== Example 4: Session Object ===")
    await example_session(runner, args.model)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(f"error: {e}", file=sys.stderr)
        sys.exit(1)
