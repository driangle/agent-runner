import { spawn, type ChildProcess } from "node:child_process";
import { createInterface } from "node:readline";
import { once } from "node:events";
import type { Runner, Result, Message, MessageType } from "../runner.js";
import { RunnerError } from "../runner.js";
import type { ClaudeCodeRunOptions } from "./options.js";
import type { StreamMessage } from "./types.js";
import { parse } from "./parser.js";

/** Supported Claude Code CLI version. */
export const SUPPORTED_CLI_VERSION = ">= 1.0.12";

/** Options for creating a ClaudeCodeRunner. */
export interface ClaudeCodeRunnerOptions {
  /** CLI binary name or path (default: "claude"). */
  binary?: string;
  /**
   * Custom command spawner for testing. Receives the binary name and args,
   * returns a ChildProcess-like object.
   */
  spawner?: (binary: string, args: string[]) => ChildProcess;
}

/** Claude Code CLI runner implementing the common Runner interface. */
export class ClaudeCodeRunner implements Runner {
  private binary: string;
  private spawner?: (binary: string, args: string[]) => ChildProcess;

  constructor(options?: ClaudeCodeRunnerOptions) {
    this.binary = options?.binary ?? "claude";
    this.spawner = options?.spawner;
  }

  async run(
    prompt: string,
    options?: ClaudeCodeRunOptions,
  ): Promise<Result> {
    const args = buildArgs(prompt, options);
    const proc = await this.spawn(args, options);

    // Start collecting stderr concurrently.
    const stderrPromise = proc.stderr
      ? collectStream(proc.stderr)
      : Promise.resolve("");

    let resultMsg: StreamMessage | undefined;
    let initSessionID = "";

    const rl = createInterface({ input: proc.stdout! });
    for await (const line of rl) {
      if (line === "") continue;
      let msg: StreamMessage;
      try {
        msg = parse(line);
      } catch {
        continue;
      }
      if (msg.type === "system" && msg.subtype === "init" && msg.session_id) {
        initSessionID = msg.session_id;
      }
      if (msg.type === "result") {
        resultMsg = msg;
      }
    }

    const [exitCode] = (await once(proc, "close")) as [number];
    const stderr = await stderrPromise;

    if (exitCode !== 0 && exitCode !== null) {
      throw new RunnerError(
        `exit ${exitCode}: ${stderr}`,
        "non_zero_exit",
      );
    }

    if (!resultMsg) {
      throw new RunnerError("no result in output", "no_result");
    }

    const result = mapResult(resultMsg);
    if (!result.sessionID && initSessionID) {
      result.sessionID = initSessionID;
    }
    return result;
  }

  async *runStream(
    prompt: string,
    options?: ClaudeCodeRunOptions,
  ): AsyncGenerator<Message> {
    const args = buildArgs(prompt, options);
    const proc = await this.spawn(args, options);
    const onMessage = options?.onMessage;

    // Eagerly capture close event and stderr so we don't miss them.
    const closePromise = once(proc, "close") as Promise<[number]>;
    const stderrPromise = proc.stderr
      ? collectStream(proc.stderr)
      : Promise.resolve("");

    try {
      const rl = createInterface({ input: proc.stdout! });
      for await (const line of rl) {
        if (line === "") continue;
        let parsed: StreamMessage;
        try {
          parsed = parse(line);
        } catch {
          continue;
        }

        const msg: Message = {
          type: mapMessageType(parsed.type),
          raw: line,
        };

        if (onMessage) {
          onMessage(msg);
        }

        yield msg;
      }
    } finally {
      // Ensure the process is cleaned up if the consumer abandons iteration.
      if (proc.exitCode === null && !proc.killed) {
        proc.kill();
      }
    }

    const [exitCode] = await closePromise;
    const stderr = await stderrPromise;

    if (exitCode !== 0 && exitCode !== null) {
      throw new RunnerError(
        `exit ${exitCode}: ${stderr}`,
        "non_zero_exit",
      );
    }
  }

  private async spawn(
    args: string[],
    options?: ClaudeCodeRunOptions,
  ): Promise<ChildProcess> {
    if (this.spawner) {
      return this.spawner(this.binary, args);
    }

    // Check binary exists by attempting to look it up.
    const { which } = await import("./which.js");
    if (!which(this.binary)) {
      throw new RunnerError(
        `runner not found: ${this.binary}`,
        "not_found",
      );
    }

    const env = options?.env
      ? { ...process.env, ...options.env }
      : process.env;

    return spawn(this.binary, args, {
      cwd: options?.workingDir,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
  }
}

/** Map a Claude stream-json type string to the common MessageType. */
function mapMessageType(type: string): MessageType {
  switch (type) {
    case "system":
      return "system";
    case "assistant":
      return "assistant";
    case "user":
      return "user";
    case "result":
      return "result";
    case "stream_event":
      // Stream events carry assistant content deltas.
      return "assistant";
    default:
      return type;
  }
}

/** Build CLI arguments from prompt and options. */
export function buildArgs(
  prompt: string,
  options?: ClaudeCodeRunOptions,
): string[] {
  const args: string[] = ["--print", "--output-format", "stream-json"];

  if (options?.model) {
    args.push("--model", options.model);
  }
  if (options?.systemPrompt) {
    args.push("--system-prompt", options.systemPrompt);
  }
  if (options?.appendSystemPrompt) {
    args.push("--append-system-prompt", options.appendSystemPrompt);
  }
  if (options?.maxTurns && options.maxTurns > 0) {
    args.push("--max-turns", String(options.maxTurns));
  }
  if (options?.skipPermissions) {
    args.push("--dangerously-skip-permissions");
  }

  // Claude-specific options.
  if (options?.allowedTools) {
    for (const tool of options.allowedTools) {
      args.push("--allowedTools", tool);
    }
  }
  if (options?.disallowedTools) {
    for (const tool of options.disallowedTools) {
      args.push("--disallowedTools", tool);
    }
  }
  if (options?.mcpConfig) {
    args.push("--mcp-config", options.mcpConfig);
  }
  if (options?.jsonSchema) {
    args.push("--json-schema", options.jsonSchema);
  }
  if (options?.maxBudgetUSD && options.maxBudgetUSD > 0) {
    args.push("--max-budget-usd", String(options.maxBudgetUSD));
  }
  if (options?.resume) {
    args.push("--resume", options.resume);
  }
  if (options?.continue) {
    args.push("--continue");
  }
  if (options?.sessionID) {
    args.push("--session-id", options.sessionID);
  }

  args.push("--", prompt);
  return args;
}

/** Map a StreamMessage result to the common Result type. */
function mapResult(msg: StreamMessage): Result {
  return {
    text: msg.result ?? "",
    isError: msg.is_error ?? false,
    exitCode: 0,
    costUSD: msg.total_cost_usd ?? 0,
    durationMs: msg.duration_ms ?? 0,
    sessionID: msg.session_id ?? "",
    usage: {
      inputTokens: msg.usage?.input_tokens ?? 0,
      outputTokens: msg.usage?.output_tokens ?? 0,
      cacheCreationInputTokens: msg.usage?.cache_creation_input_tokens ?? 0,
      cacheReadInputTokens: msg.usage?.cache_read_input_tokens ?? 0,
    },
  };
}

/** Collect all data from a readable stream into a string. */
function collectStream(
  stream: NodeJS.ReadableStream,
): Promise<string> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString()));
    stream.on("error", () => resolve(""));
  });
}
