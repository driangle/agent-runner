import type { Result, Usage } from "../types.js";
import type { ResultStreamMessage } from "./types.js";

/** Map a ResultStreamMessage to a common Result. */
export function mapResult(
  msg: ResultStreamMessage,
  fallbackSessionId: string,
): Result {
  const usage: Usage = {
    inputTokens: msg.usage?.input_tokens ?? 0,
    outputTokens: msg.usage?.output_tokens ?? 0,
    cacheCreationInputTokens: msg.usage?.cache_creation_input_tokens ?? 0,
    cacheReadInputTokens: msg.usage?.cache_read_input_tokens ?? 0,
  };

  return {
    text: msg.result ?? "",
    isError: msg.is_error ?? false,
    exitCode: 0,
    usage,
    costUSD: msg.total_cost_usd ?? 0,
    durationMs: msg.duration_ms ?? 0,
    sessionId: msg.session_id || fallbackSessionId,
  };
}
