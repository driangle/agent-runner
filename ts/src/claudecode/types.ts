/**
 * Types for Claude Code CLI stream-json output.
 * Each line from `claude -p --output-format stream-json` is a StreamMessage.
 */

/** Top-level envelope for all Claude stream-json lines. */
export interface StreamMessage {
  type: string;
  subtype?: string;

  /** Content blocks lifted from assistant message wrapper (set by parse). */
  content?: ContentBlock[];

  /** Nested message object in assistant-type lines. */
  message?: AssistantMessage;

  /** Final result text (when type === "result"). */
  result?: string;
  is_error?: boolean;
  total_cost_usd?: number;
  duration_ms?: number;
  duration_api_ms?: number;
  num_turns?: number;
  session_id?: string;
  model?: string;
  usage?: ResultUsage;

  /** Available tools (from system/init). */
  tools?: unknown[];

  /** Rate limit info (when type === "rate_limit_event"). */
  rate_limit_info?: RateLimitInfo;

  /** Raw inner event (when type === "stream_event"). */
  event?: StreamEventInnerRaw | StreamEventInner;
  parent_tool_use_id?: string;
}

/** Nested message object inside assistant-type stream lines. */
export interface AssistantMessage {
  model?: string;
  id?: string;
  content?: ContentBlock[];
  stop_reason?: string;
  usage?: StreamUsage;
}

/** Content block inside an assistant message. */
export interface ContentBlock {
  type: string;
  /** Text content for "text" blocks. */
  text?: string;
  /** Thinking content for "thinking" blocks. */
  thinking?: string;
  /** Tool name for "tool_use" blocks. */
  name?: string;
  /** Tool call arguments for "tool_use" blocks. */
  input?: unknown;
  /** Tool execution output for "tool_result" blocks. */
  content?: unknown;
}

/** Parsed inner event from a stream_event line. */
export interface StreamEventInner {
  type: string;
  message?: MessageStartData;
  index?: number;
  content_block?: ContentBlockInfo;
  delta?: Delta;
  usage?: StreamUsage;
}

/** Raw inner event — same shape but as parsed from JSON. */
type StreamEventInnerRaw = StreamEventInner;

/** Message metadata from a message_start event. */
export interface MessageStartData {
  model: string;
  id: string;
  usage?: StreamUsage;
}

/** Content block info from content_block_start events. */
export interface ContentBlockInfo {
  type: string;
  name?: string;
  id?: string;
}

/** Incremental data in delta events. */
export interface Delta {
  type?: string;
  text?: string;
  thinking?: string;
  partial_json?: string;
  stop_reason?: string;
  stop_sequence?: string;
}

/** Rate limit info from rate_limit_event messages. */
export interface RateLimitInfo {
  status: string;
  rateLimitType?: string;
  utilization?: number;
  resetsAt?: number;
  isUsingOverage?: boolean;
}

/** Token counts from the final result message (includes cache fields). */
export interface ResultUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

/** Token counts from streaming events (no cache fields). */
export interface StreamUsage {
  input_tokens?: number;
  output_tokens?: number;
}
