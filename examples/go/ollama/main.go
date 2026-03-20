// This example demonstrates how to use the agentrunner Go library to invoke
// Ollama models programmatically, covering basic usage, streaming, and the
// Session object pattern.
//
// Prerequisites:
//   - Ollama installed and running: https://ollama.com
//   - A model pulled: ollama pull llama3.2
//
// Run:
//
//	go run .
//	go run . --model codellama --base-url http://localhost:11434
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/driangle/agent-runner/agentrunner"
	"github.com/driangle/agent-runner/agentrunner/ollama"
)

func main() {
	model := flag.String("model", "llama3.2", "Ollama model name")
	baseURL := flag.String("base-url", "http://localhost:11434", "Ollama API base URL")
	verbose := flag.Bool("verbose", false, "enable debug logging")
	flag.Parse()

	var runnerOpts []ollama.RunnerOption
	runnerOpts = append(runnerOpts, ollama.WithBaseURL(*baseURL))
	if *verbose {
		runnerOpts = append(runnerOpts, ollama.WithLogger(
			slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelDebug})),
		))
	}

	if err := run(runnerOpts, *model); err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}
}

func run(runnerOpts []ollama.RunnerOption, model string) error {
	ctx := context.Background()

	runner := ollama.NewRunner(runnerOpts...)

	// --- Example 1: Simple Run ---
	fmt.Println("=== Example 1: Simple Run ===")
	if err := exampleSimpleRun(ctx, runner, model); err != nil {
		return fmt.Errorf("simple run: %w", err)
	}

	// --- Example 2: Streaming ---
	fmt.Println("\n=== Example 2: Streaming ===")
	if err := exampleStreaming(ctx, runner, model); err != nil {
		return fmt.Errorf("streaming: %w", err)
	}

	// --- Example 3: Thinking Model ---
	fmt.Println("\n=== Example 3: Thinking Model ===")
	if err := exampleThinking(ctx, runner, model); err != nil {
		return fmt.Errorf("thinking: %w", err)
	}

	// --- Example 4: Session Object ---
	fmt.Println("\n=== Example 4: Session Object ===")
	if err := exampleSession(ctx, runner, model); err != nil {
		return fmt.Errorf("session: %w", err)
	}

	return nil
}

// exampleSimpleRun sends a single prompt and prints the result.
func exampleSimpleRun(ctx context.Context, runner *ollama.Runner, model string) error {
	prompt := "What is 2+2? Reply with just the number."
	fmt.Printf("Prompt:   %s\n", prompt)

	result, err := runner.Run(ctx, prompt,
		agentrunner.WithModel(model),
		agentrunner.WithTimeout(5*time.Minute),
	)
	if err != nil {
		return err
	}

	fmt.Printf("Response: %s\n", result.Text)
	fmt.Printf("Cost:     $%.4f (always 0 for local models)\n", result.CostUSD)
	fmt.Printf("Tokens:   %d in / %d out\n", result.Usage.InputTokens, result.Usage.OutputTokens)
	fmt.Printf("Duration: %s\n", result.Duration)
	fmt.Printf("Error:    %v\n", result.IsError)
	return nil
}

// exampleStreaming uses Start to print tokens as they arrive.
func exampleStreaming(ctx context.Context, runner *ollama.Runner, model string) error {
	prompt := "List 3 fun facts about Go (the programming language). Be brief."
	fmt.Printf("Prompt: %s\n", prompt)
	fmt.Println("---")

	session, err := runner.Start(ctx, prompt,
		agentrunner.WithModel(model),
		agentrunner.WithTimeout(5*time.Minute),
		agentrunner.WithSystemPrompt("You are a helpful assistant. Keep answers concise."),
		ollama.WithTemperature(0.7),
	)
	if err != nil {
		return err
	}

	for msg := range session.Messages {
		switch msg.Type {
		case agentrunner.MessageTypeAssistant:
			// Each assistant message is a streaming chunk with partial content.
			var chunk struct {
				Message struct {
					Content string `json:"content"`
				} `json:"message"`
			}
			if err := json.Unmarshal(msg.Raw, &chunk); err == nil {
				fmt.Print(chunk.Message.Content)
			}
		case agentrunner.MessageTypeResult:
			// Final message with statistics.
			var final struct {
				TotalDuration int64 `json:"total_duration"`
				PromptEvalCount int `json:"prompt_eval_count"`
				EvalCount     int   `json:"eval_count"`
			}
			if err := json.Unmarshal(msg.Raw, &final); err == nil {
				fmt.Println("\n---")
				fmt.Printf("Duration: %dms\n", final.TotalDuration/1e6)
				fmt.Printf("Tokens:   %d in / %d out\n", final.PromptEvalCount, final.EvalCount)
			}
		}
	}

	if _, err := session.Result(); err != nil {
		return err
	}
	return nil
}

// exampleThinking demonstrates streaming with a thinking model (e.g. qwen3).
// Thinking chunks arrive first with reasoning in message.thinking, followed by
// content chunks with the final answer in message.content.
func exampleThinking(ctx context.Context, runner *ollama.Runner, model string) error {
	prompt := "How many r's are in the word strawberry?"
	fmt.Printf("Prompt: %s\n", prompt)
	fmt.Println("---")

	session, err := runner.Start(ctx, prompt,
		agentrunner.WithModel(model),
		agentrunner.WithTimeout(5*time.Minute),
		ollama.WithThink(true),
	)
	if err != nil {
		return err
	}

	for msg := range session.Messages {
		if msg.Type != agentrunner.MessageTypeAssistant {
			continue
		}
		var chunk struct {
			Message struct {
				Content  string `json:"content"`
				Thinking string `json:"thinking"`
			} `json:"message"`
		}
		if err := json.Unmarshal(msg.Raw, &chunk); err != nil {
			continue
		}
		if chunk.Message.Thinking != "" {
			fmt.Printf("\033[2m%s\033[0m", chunk.Message.Thinking) // dim for thinking
		}
		if chunk.Message.Content != "" {
			fmt.Print(chunk.Message.Content)
		}
	}
	fmt.Println("\n---")

	if _, err := session.Result(); err != nil {
		return err
	}
	return nil
}

// exampleSession demonstrates the Session object pattern with full control
// over the lifecycle: iterating messages and accessing the result.
func exampleSession(ctx context.Context, runner *ollama.Runner, model string) error {
	prompt := "What is the capital of France? Reply with just the city name."
	fmt.Printf("Prompt: %s\n", prompt)

	session, err := runner.Start(ctx, prompt,
		agentrunner.WithModel(model),
		agentrunner.WithTimeout(5*time.Minute),
	)
	if err != nil {
		return err
	}

	// Iterate messages as they arrive, printing streamed content.
	var count int
	for msg := range session.Messages {
		count++
		if msg.Type == agentrunner.MessageTypeAssistant {
			var chunk struct {
				Message struct {
					Content string `json:"content"`
				} `json:"message"`
			}
			if err := json.Unmarshal(msg.Raw, &chunk); err == nil {
				fmt.Print(chunk.Message.Content)
			}
		}
	}
	fmt.Println()
	fmt.Printf("Received %d messages\n", count)

	// Get the final result.
	result, err := session.Result()
	if err != nil {
		return err
	}

	fmt.Printf("Response: %s\n", result.Text)
	fmt.Printf("Duration: %s\n", result.Duration)
	return nil
}
