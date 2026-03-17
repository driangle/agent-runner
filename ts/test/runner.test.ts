import { describe, it, expect } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";
import { ClaudeCodeRunner, buildArgs } from "../src/claudecode/runner.js";
import type { ClaudeCodeRunOptions } from "../src/claudecode/options.js";
import type { Message } from "../src/runner.js";
import { RunnerError } from "../src/runner.js";

const MOCK_CLI = resolve(import.meta.dirname, "fixtures/mock-claude.mjs");

/** Create a spawner that runs the mock CLI with the given mode. */
function mockSpawner(
  mode: string,
): (binary: string, args: string[]) => ChildProcess {
  return (_binary: string, _args: string[]) => {
    return spawn("node", [MOCK_CLI], {
      env: { ...process.env, MOCK_MODE: mode },
      stdio: ["ignore", "pipe", "pipe"],
    });
  };
}

// --- run() tests ---

describe("ClaudeCodeRunner.run", () => {
  it("happy path", async () => {
    const runner = new ClaudeCodeRunner({ spawner: mockSpawner("happy") });
    const result = await runner.run("say hello");

    expect(result.text).toBe("Hello world");
    expect(result.sessionID).toBe("sess-1");
    expect(result.costUSD).toBe(0.05);
    expect(result.durationMs).toBe(1234);
    expect(result.isError).toBe(false);
    expect(result.usage.inputTokens).toBe(100);
    expect(result.usage.outputTokens).toBe(50);
    expect(result.usage.cacheCreationInputTokens).toBe(10);
    expect(result.usage.cacheReadInputTokens).toBe(20);
  });

  it("error result", async () => {
    const runner = new ClaudeCodeRunner({
      spawner: mockSpawner("error_result"),
    });
    const result = await runner.run("fail please");

    expect(result.isError).toBe(true);
    expect(result.text).toBe("Something failed");
    expect(result.sessionID).toBe("sess-err");
  });

  it("no result throws RunnerError", async () => {
    const runner = new ClaudeCodeRunner({
      spawner: mockSpawner("no_result"),
    });

    await expect(runner.run("hello")).rejects.toThrow(RunnerError);
    await expect(runner.run("hello")).rejects.toMatchObject({
      code: "no_result",
    });
  });

  it("non-zero exit throws RunnerError", async () => {
    const runner = new ClaudeCodeRunner({
      spawner: mockSpawner("nonzero_exit"),
    });

    await expect(runner.run("hello")).rejects.toThrow(RunnerError);
    await expect(runner.run("hello")).rejects.toMatchObject({
      code: "non_zero_exit",
    });
  });

  it("session ID falls back to init", async () => {
    const runner = new ClaudeCodeRunner({
      spawner: mockSpawner("init_session_only"),
    });
    const result = await runner.run("hello");

    expect(result.sessionID).toBe("sess-from-init");
  });

  it("not found throws RunnerError", async () => {
    const runner = new ClaudeCodeRunner({ binary: "nonexistent-binary-xyz" });

    await expect(runner.run("hello")).rejects.toThrow(RunnerError);
    await expect(runner.run("hello")).rejects.toMatchObject({
      code: "not_found",
    });
  });
});

// --- runStream() tests ---

describe("ClaudeCodeRunner.runStream", () => {
  it("happy path streams all messages", async () => {
    const runner = new ClaudeCodeRunner({
      spawner: mockSpawner("stream_multi"),
    });
    const messages: Message[] = [];
    for await (const msg of runner.runStream("say hello")) {
      messages.push(msg);
    }

    expect(messages.length).toBe(5);
    // First message should be system.
    expect(messages[0].type).toBe("system");
    // Last message should be result.
    expect(messages[messages.length - 1].type).toBe("result");
    // Middle messages should be assistant (stream_event maps to assistant).
    for (const msg of messages.slice(1, -1)) {
      expect(msg.type).toBe("assistant");
    }
  });

  it("all messages have raw JSON", async () => {
    const runner = new ClaudeCodeRunner({
      spawner: mockSpawner("stream_multi"),
    });
    for await (const msg of runner.runStream("test raw")) {
      expect(msg.raw).toBeTruthy();
      expect(msg.raw.length).toBeGreaterThan(0);
    }
  });

  it("onMessage callback is invoked", async () => {
    const runner = new ClaudeCodeRunner({
      spawner: mockSpawner("stream_multi"),
    });
    const callbackMessages: Message[] = [];
    const channelMessages: Message[] = [];

    for await (const msg of runner.runStream("test callback", {
      onMessage: (m) => callbackMessages.push(m),
    })) {
      channelMessages.push(msg);
    }

    expect(callbackMessages.length).toBe(channelMessages.length);
    for (let i = 0; i < callbackMessages.length; i++) {
      expect(callbackMessages[i].type).toBe(channelMessages[i].type);
    }
  });

  it("non-zero exit throws after streaming", async () => {
    const runner = new ClaudeCodeRunner({
      spawner: mockSpawner("nonzero_exit"),
    });

    const drain = async () => {
      for await (const _msg of runner.runStream("hello")) {
        // drain
      }
    };

    await expect(drain()).rejects.toThrow(RunnerError);
  });

  it("not found throws RunnerError", async () => {
    const runner = new ClaudeCodeRunner({ binary: "nonexistent-binary-xyz" });

    const drain = async () => {
      for await (const _msg of runner.runStream("hello")) {
        // drain
      }
    };

    await expect(drain()).rejects.toThrow(RunnerError);
    await expect(drain()).rejects.toMatchObject({ code: "not_found" });
  });
});

// --- buildArgs tests ---

describe("buildArgs", () => {
  it("minimal args", () => {
    const args = buildArgs("hello world");
    expect(args).toEqual([
      "--print",
      "--output-format",
      "stream-json",
      "--",
      "hello world",
    ]);
  });

  it("all common options", () => {
    const opts: ClaudeCodeRunOptions = {
      model: "claude-sonnet-4-6",
      systemPrompt: "You are helpful",
      appendSystemPrompt: "Be concise",
      maxTurns: 5,
      skipPermissions: true,
    };
    const args = buildArgs("test prompt", opts);
    const joined = args.join(" ");

    expect(joined).toContain("--model claude-sonnet-4-6");
    expect(joined).toContain("--system-prompt You are helpful");
    expect(joined).toContain("--append-system-prompt Be concise");
    expect(joined).toContain("--max-turns 5");
    expect(joined).toContain("--dangerously-skip-permissions");
    // Prompt must be last after "--".
    expect(args[args.length - 1]).toBe("test prompt");
    expect(args[args.length - 2]).toBe("--");
  });

  it("claude-specific options", () => {
    const opts: ClaudeCodeRunOptions = {
      allowedTools: ["Read", "Write"],
      disallowedTools: ["Bash"],
      mcpConfig: "/tmp/mcp.json",
      jsonSchema: '{"type":"object"}',
      maxBudgetUSD: 1.5,
      resume: "sess-123",
    };
    const args = buildArgs("test", opts);
    const joined = args.join(" ");

    expect(joined).toContain("--allowedTools Read");
    expect(joined).toContain("--allowedTools Write");
    expect(joined).toContain("--disallowedTools Bash");
    expect(joined).toContain("--mcp-config /tmp/mcp.json");
    expect(joined).toContain('--json-schema {"type":"object"}');
    expect(joined).toContain("--max-budget-usd 1.5");
    expect(joined).toContain("--resume sess-123");
  });

  it("session ID option", () => {
    const args = buildArgs("test", { sessionID: "my-session-42" });
    const joined = args.join(" ");
    expect(joined).toContain("--session-id my-session-42");
  });

  it("continue option", () => {
    const args = buildArgs("test", { continue: true });
    expect(args).toContain("--continue");
  });
});
