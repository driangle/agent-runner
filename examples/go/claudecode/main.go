// This example demonstrates how to use the agentrunner Go library to invoke
// Claude Code CLI programmatically, covering basic usage, streaming, and
// session management.
//
// Prerequisites:
//   - Claude Code CLI installed (>= 1.0.12): https://docs.anthropic.com/en/docs/claude-code
//   - Authenticated with `claude login`
//
// Run:
//
//	go run .
//	go run . --claude /path/to/claude
package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"time"

	agentrunner "github.com/driangle/agentrunner-go"
	"github.com/driangle/agentrunner-go/claudecode"
)

func main() {
	claudeBinary := flag.String("claude", "claude", "path to the Claude Code CLI binary")
	verbose := flag.Bool("verbose", false, "enable debug logging")
	flag.Parse()

	var runnerOpts []claudecode.RunnerOption
	runnerOpts = append(runnerOpts, claudecode.WithBinary(*claudeBinary))
	if *verbose {
		runnerOpts = append(runnerOpts, claudecode.WithLogger(
			slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelDebug})),
		))
	}

	if err := run(runnerOpts); err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}
}

func run(runnerOpts []claudecode.RunnerOption) error {
	ctx := context.Background()

	runner := claudecode.NewRunner(runnerOpts...)

	// --- Example 1: Simple Run ---
	fmt.Println("=== Example 1: Simple Run ===")
	if err := exampleSimpleRun(ctx, runner); err != nil {
		return fmt.Errorf("simple run: %w", err)
	}

	// --- Example 2: Streaming ---
	fmt.Println("\n=== Example 2: Streaming ===")
	if err := exampleStreaming(ctx, runner); err != nil {
		return fmt.Errorf("streaming: %w", err)
	}

	// --- Example 3: Session Resume ---
	fmt.Println("\n=== Example 3: Session Resume ===")
	if err := exampleSessionResume(ctx, runner); err != nil {
		return fmt.Errorf("session resume: %w", err)
	}

	return nil
}

// exampleSimpleRun sends a single prompt and prints the result.
func exampleSimpleRun(ctx context.Context, runner *claudecode.Runner) error {
	result, err := runner.Run(ctx, "What is 2+2? Reply with just the number.",
		agentrunner.WithMaxTurns(1),
		agentrunner.WithTimeout(30*time.Second),
	)
	if err != nil {
		return err
	}

	fmt.Printf("Response: %s\n", result.Text)
	fmt.Printf("Cost:     $%.4f\n", result.CostUSD)
	fmt.Printf("Tokens:   %d in / %d out\n", result.Usage.InputTokens, result.Usage.OutputTokens)
	fmt.Printf("Duration: %dms\n", result.DurationMs)
	return nil
}

// exampleStreaming uses RunStream to print messages as they arrive.
func exampleStreaming(ctx context.Context, runner *claudecode.Runner) error {
	msgCh, errCh := runner.RunStream(ctx, "List 3 fun facts about Go (the programming language). Be brief.",
		agentrunner.WithMaxTurns(1),
		agentrunner.WithTimeout(30*time.Second),
	)

	for msg := range msgCh {
		switch msg.Type {
		case agentrunner.MessageTypeAssistant:
			// Parse the raw JSON to extract text content.
			parsed, parseErr := claudecode.Parse(string(msg.Raw))
			if parseErr != nil {
				continue
			}
			for _, block := range parsed.Content {
				if block.Type == "text" && block.Text != "" {
					fmt.Print(block.Text)
				}
			}
		case agentrunner.MessageTypeResult:
			var result struct {
				TotalCostUSD float64 `json:"total_cost_usd"`
			}
			if err := json.Unmarshal(msg.Raw, &result); err == nil {
				fmt.Printf("\n\n(cost: $%.4f)\n", result.TotalCostUSD)
			}
		}
	}

	if err := <-errCh; err != nil {
		return err
	}
	return nil
}

// exampleSessionResume demonstrates multi-turn conversations using session IDs.
func exampleSessionResume(ctx context.Context, runner *claudecode.Runner) error {
	// First turn: ask a question.
	result, err := runner.Run(ctx, "Remember this number: 42. Just confirm you've noted it.",
		agentrunner.WithMaxTurns(1),
		agentrunner.WithTimeout(30*time.Second),
	)
	if err != nil {
		return err
	}
	fmt.Printf("Turn 1: %s\n", result.Text)
	fmt.Printf("Session: %s\n", result.SessionID)

	if result.SessionID == "" {
		return errors.New("no session ID returned — cannot demonstrate resume")
	}

	// Second turn: resume the session and reference the earlier context.
	result, err = runner.Run(ctx, "What number did I ask you to remember?",
		agentrunner.WithMaxTurns(1),
		agentrunner.WithTimeout(30*time.Second),
		claudecode.WithResume(result.SessionID),
	)
	if err != nil {
		return err
	}
	fmt.Printf("Turn 2: %s\n", result.Text)
	return nil
}
