import type { Message } from "../types.js";
import type { ChatResponse } from "./types.js";

/** Typed alias for a Message carrying Ollama chat data. */
export type OllamaMessage = Message<ChatResponse>;

/** Return the text content from an assistant or result message, or undefined. */
export function messageText(msg: OllamaMessage): string | undefined {
  const data = msg.data;
  if (data.message.content) return data.message.content;
  return undefined;
}

/** Return the thinking content from a message, or undefined. */
export function messageThinking(msg: OllamaMessage): string | undefined {
  return msg.data.message.thinking;
}

/** Whether this is the final (done) message. */
export function messageIsResult(msg: OllamaMessage): boolean {
  return msg.data.done;
}
