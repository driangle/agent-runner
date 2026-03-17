import type { RunOptions, Message } from "../runner.js";

/** Claude Code-specific options extending the common RunOptions. */
export interface ClaudeCodeRunOptions extends RunOptions {
  /** Tools the agent may use. */
  allowedTools?: string[];
  /** Tools the agent may not use. */
  disallowedTools?: string[];
  /** Path to MCP server configuration file. */
  mcpConfig?: string;
  /** JSON Schema for structured output. */
  jsonSchema?: string;
  /** Cost limit in USD. */
  maxBudgetUSD?: number;
  /** Session ID to resume. */
  resume?: string;
  /** Continue the most recent session. */
  continue?: boolean;
  /** Specific session ID. */
  sessionID?: string;
  /** Callback invoked for each streaming message. */
  onMessage?: (message: Message) => void;
}
