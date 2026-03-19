/** Request body for POST /api/chat. */
export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  stream: boolean;
  think?: boolean;
  options?: ModelOptions;
  format?: string;
  keep_alive?: string;
}

/** A single message in the chat history. */
export interface ChatMessage {
  role: string;
  content: string;
  thinking?: string;
}

/** Ollama model parameters. */
export interface ModelOptions {
  temperature?: number;
  num_ctx?: number;
  num_predict?: number;
  seed?: number;
  stop?: string[];
  top_k?: number;
  top_p?: number;
  min_p?: number;
}

/** A single ndjson line from the streaming /api/chat response. */
export interface ChatResponse {
  model: string;
  created_at: string;
  message: ChatMessage;
  done: boolean;
  done_reason?: string;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}
