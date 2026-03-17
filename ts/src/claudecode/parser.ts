import type { StreamMessage, StreamEventInner } from "./types.js";

/**
 * Parse a single JSON line from Claude Code's stream-json output into a
 * typed StreamMessage. Unknown fields are silently ignored for forward
 * compatibility.
 *
 * For assistant-type lines, content blocks are lifted from the nested
 * "message" wrapper into StreamMessage.content for convenient access.
 * For stream_event lines, the inner event is already parsed as part of
 * the JSON deserialization.
 */
export function parse(line: string): StreamMessage {
  const msg: StreamMessage = JSON.parse(line);

  // Lift content from assistant message wrapper for convenience.
  if (msg.type === "assistant" && msg.message?.content) {
    msg.content = msg.message.content;
  }

  // Inner event is already parsed by JSON.parse (unlike Go where it's
  // json.RawMessage that needs separate unmarshaling).

  return msg;
}
