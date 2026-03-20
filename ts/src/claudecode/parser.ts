import type {
  StreamMessage,
  AssistantStreamMessage,
  StreamEventStreamMessage,
  StreamEventInner,
} from "./types.js";

/**
 * Type guard that validates a parsed JSON value has the minimum shape
 * of a StreamMessage (an object with a string `type` field).
 */
function isStreamMessageShape(
  value: unknown,
): value is Record<string, unknown> & { type: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as Record<string, unknown>).type === "string"
  );
}

/**
 * Parse a single JSON line from Claude Code's stream-json output
 * into a typed StreamMessage. Unknown fields are preserved for
 * forward compatibility.
 *
 * For assistant-type lines, content blocks are lifted from the nested
 * "message" wrapper into content for convenient access.
 * For stream_event lines, the inner event is parsed into event.
 */
export function parse(line: string): StreamMessage {
  const raw: unknown = JSON.parse(line);

  if (!isStreamMessageShape(raw)) {
    throw new SyntaxError("not a valid stream message: missing type field");
  }

  switch (raw.type) {
    case "assistant": {
      const msg = raw as unknown as AssistantStreamMessage;
      msg.content = msg.message?.content ?? [];
      return msg;
    }

    case "stream_event": {
      const msg = raw as unknown as StreamEventStreamMessage;
      if (raw.event != null && typeof raw.event === "object") {
        const inner = raw.event as Record<string, unknown>;
        if (typeof inner.type === "string") {
          msg.event = inner as unknown as StreamEventInner;
        }
      }
      return msg;
    }

    default:
      return raw as unknown as StreamMessage;
  }
}
