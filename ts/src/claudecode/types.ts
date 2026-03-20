/**
 * Types for Claude Code CLI stream-json output.
 * Each line from `claude -p --output-format stream-json` maps to StreamMessage.
 *
 * StreamMessage is a discriminated union on the `type` field.
 */

/** Base fields shared by all stream message types. */
interface BaseStreamMessage {
  type: string;
  subtype?: string;
  session_id?: string;
}

/** System messages (e.g., init with session info and available tools). */
export interface SystemStreamMessage extends BaseStreamMessage {
  type: "system";
  model?: string;
  tools?: unknown[];
}

/** Assistant messages with content blocks. */
export interface AssistantStreamMessage extends BaseStreamMessage {
  type: "assistant";
  /** Nested message object from the CLI output. */
  message?: AssistantMessage;
  /**
   * Content blocks lifted from the nested message wrapper.
   * Populated by parse() for convenient access.
   */
  content: ContentBlock[];
}

/** User messages (tool results). */
export interface UserStreamMessage extends BaseStreamMessage {
  type: "user";
  message?: { content?: ContentBlock[] };
}

/** Final result message with cost, usage, and session info. */
export interface ResultStreamMessage extends BaseStreamMessage {
  type: "result";
  result?: string;
  is_error?: boolean;
  total_cost_usd?: number;
  duration_ms?: number;
  duration_api_ms?: number;
  num_turns?: number;
  model?: string;
  usage?: ResultUsage;
}

/** Raw API stream event wrapper. */
export interface StreamEventStreamMessage extends BaseStreamMessage {
  type: "stream_event";
  event?: StreamEventInner;
  parent_tool_use_id?: string;
}

/** Rate limit event. */
export interface RateLimitStreamMessage extends BaseStreamMessage {
  type: "rate_limit_event";
  rate_limit_info?: RateLimitInfo;
}

/** Catch-all for unknown/future message types (forward compatibility). */
export interface UnknownStreamMessage extends BaseStreamMessage {
  type: string;
}

/** Discriminated union of all Claude stream-json message types. */
export type StreamMessage =
  | SystemStreamMessage
  | AssistantStreamMessage
  | UserStreamMessage
  | ResultStreamMessage
  | StreamEventStreamMessage
  | RateLimitStreamMessage
  | UnknownStreamMessage;

/** Nested "message" object inside assistant-type stream lines. */
export interface AssistantMessage {
  model?: string;
  id?: string;
  content?: ContentBlock[];
  stop_reason?: string;
  usage?: StreamUsage;
}

/** One block inside an assistant message. */
export interface ContentBlock {
  type: string;
  text?: string;
  thinking?: string;
  name?: string;
  input?: unknown;
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

/** Message metadata from a message_start event. */
export interface MessageStartData {
  model: string;
  id: string;
  usage?: StreamUsage;
}

/** Content block info in content_block_start events. */
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

/** Rate limit details from rate_limit_event messages. */
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

/** Token counts from streaming events. */
export interface StreamUsage {
  input_tokens?: number;
  output_tokens?: number;
}
