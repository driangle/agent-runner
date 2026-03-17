/**
 * Common Runner interface and types for invoking AI coding agents.
 * Each runner (Claude Code, Gemini, Codex, Ollama) implements this interface,
 * allowing callers to swap runners without changing their code.
 */

/** Token consumption counts. */
export interface Usage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
}

/** Final output from a runner invocation. */
export interface Result {
  /** Final response text. */
  text: string;
  /** Whether the run ended in error. */
  isError: boolean;
  /** Process exit code (CLI runners) or 0 (API runners). */
  exitCode: number;
  /** Token counts. */
  usage: Usage;
  /** Estimated cost in USD (0 for local runners). */
  costUSD: number;
  /** Wall-clock duration in milliseconds. */
  durationMs: number;
  /** Session identifier for resumption. */
  sessionID: string;
}

/** Message type taxonomy for streaming output. */
export type MessageType =
  | "system"
  | "assistant"
  | "user"
  | "tool_use"
  | "tool_result"
  | "result"
  | "error"
  | (string & {});

/** Unit of streaming output from runStream. */
export interface Message {
  /** Message type. */
  type: MessageType;
  /** Original JSON line for runner-specific parsing. */
  raw: string;
}

/** Common options for all runners. All fields are optional. */
export interface RunOptions {
  /** Model name or alias. */
  model?: string;
  /** System prompt override. */
  systemPrompt?: string;
  /** Appended to the default system prompt. */
  appendSystemPrompt?: string;
  /** Working directory for the subprocess. */
  workingDir?: string;
  /** Additional environment variables. */
  env?: Record<string, string>;
  /** Maximum number of agentic turns. */
  maxTurns?: number;
  /** Overall execution timeout in milliseconds. */
  timeout?: number;
  /** Bypass interactive permission prompts. */
  skipPermissions?: boolean;
}

/** Runner executes prompts against an AI coding agent and returns results. */
export interface Runner {
  /** Send a prompt and wait for the final result. */
  run(prompt: string, options?: RunOptions): Promise<Result>;
  /** Send a prompt and stream messages as they arrive. */
  runStream(prompt: string, options?: RunOptions): AsyncIterable<Message>;
}

/** Error categories for runner failures. */
export class RunnerError extends Error {
  constructor(
    message: string,
    public readonly code: RunnerErrorCode,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = "RunnerError";
  }
}

export type RunnerErrorCode =
  | "not_found"
  | "timeout"
  | "non_zero_exit"
  | "parse_error"
  | "cancelled"
  | "no_result";
