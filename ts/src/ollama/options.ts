import type { RunOptions, OnMessageFn, Logger } from "../types.js";

/**
 * Function that performs an HTTP fetch. Used for dependency injection in tests.
 * Must accept the same signature as the global fetch.
 */
export type FetchFn = typeof fetch;

/** Configuration for creating an Ollama runner. */
export interface OllamaRunnerConfig {
  /** Base URL for the Ollama API (default: "http://localhost:11434"). */
  baseURL?: string;

  /** Inject a custom fetch function for testing. */
  fetch?: FetchFn;

  /** Structured logger for debug output (nil by default). */
  logger?: Logger;
}

/** Ollama-specific options that extend the common RunOptions. */
export interface OllamaRunOptions extends RunOptions {
  /** Sampling temperature. */
  temperature?: number;

  /** Context window size. */
  numCtx?: number;

  /** Maximum number of tokens to generate. */
  numPredict?: number;

  /** Random seed for reproducible generation. */
  seed?: number;

  /** Stop sequences. */
  stop?: string[];

  /** Top-k sampling parameter. */
  topK?: number;

  /** Top-p (nucleus) sampling parameter. */
  topP?: number;

  /** Min-p sampling parameter. */
  minP?: number;

  /** Response format (e.g. "json"). */
  format?: string;

  /** How long the model stays loaded (e.g. "5m", "0" to unload immediately). */
  keepAlive?: string;

  /** Enable thinking/reasoning for supported models (e.g. qwen3). */
  think?: boolean;

  /** Callback invoked for each streaming message. */
  onMessage?: OnMessageFn;
}
