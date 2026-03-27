# Ollama Runner

The Ollama runner talks to the Ollama HTTP API rather than shelling out to a CLI. This enables fully offline agent execution with locally-hosted models.

## Requirements

- Ollama installed and running (default: `http://localhost:11434`)
- A model pulled locally (e.g., `ollama pull llama3.2`)

## How It Works

The runner sends requests to the Ollama `/api/chat` endpoint and streams responses. Unlike CLI-based runners, there is no subprocess — communication is via HTTP.

## Runner-Specific Options

| Option | Type | Description |
|--------|------|-------------|
| `temperature` | `float` | Sampling temperature |
| `numCtx` | `int` | Context window size |
| `numPredict` | `int` | Maximum tokens to generate |
| `seed` | `int` | Random seed for reproducibility |
| `stop` | `string[]` | Stop sequences |
| `topK` | `int` | Top-K sampling parameter |
| `topP` | `float` | Top-P (nucleus) sampling parameter |
| `minP` | `float` | Min-P sampling parameter |
| `format` | `string` | `"json"` or a JSON Schema for structured output |
| `keepAlive` | `duration` | How long to keep the model loaded in memory |
| `think` | `bool` | Enable thinking/reasoning for supported models |

## Examples

### Simple Run

::: code-group

```go [Go]
runner := ollama.NewRunner()
result, err := runner.Run(ctx, "What is 2+2?",
    agentrunner.WithModel("llama3.2"),
)
```

```ts [TypeScript]
const runner = createOllamaRunner();
const result = await runner.run("What is 2+2?", {
  model: "llama3.2",
});
```

```python [Python]
runner = OllamaRunner()
result = await runner.run("What is 2+2?", OllamaRunOptions(
    model="llama3.2",
))
```

:::

### With Sampling Options

::: code-group

```go [Go]
result, err := runner.Run(ctx, "Write a poem",
    agentrunner.WithModel("llama3.2"),
    ollama.WithTemperature(0.9),
    ollama.WithTopP(0.95),
    ollama.WithNumPredict(500),
)
```

```ts [TypeScript]
const result = await runner.run("Write a poem", {
  model: "llama3.2",
  temperature: 0.9,
  topP: 0.95,
  numPredict: 500,
});
```

```python [Python]
result = await runner.run("Write a poem", OllamaRunOptions(
    model="llama3.2",
    temperature=0.9,
    top_p=0.95,
    num_predict=500,
))
```

:::

### Structured Output

::: code-group

```go [Go]
result, err := runner.Run(ctx, "List 3 colors",
    agentrunner.WithModel("llama3.2"),
    ollama.WithFormat("json"),
)
```

```ts [TypeScript]
const result = await runner.run("List 3 colors", {
  model: "llama3.2",
  format: "json",
});
```

```python [Python]
result = await runner.run("List 3 colors", OllamaRunOptions(
    model="llama3.2",
    format="json",
))
```

:::

### Streaming

::: code-group

```go [Go]
session, _ := runner.Start(ctx, "Tell me a story",
    agentrunner.WithModel("llama3.2"),
)
for msg := range session.Messages {
    fmt.Print(msg.Text())
}
```

```ts [TypeScript]
for await (const msg of runner.runStream("Tell me a story", {
  model: "llama3.2",
})) {
  const text = messageText(msg);
  if (text) process.stdout.write(text);
}
```

```python [Python]
async for msg in runner.run_stream("Tell me a story", OllamaRunOptions(
    model="llama3.2",
)):
    if msg.text:
        print(msg.text, end="")
```

:::
