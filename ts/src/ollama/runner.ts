import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import type { Runner, Result, Message, Session, Usage } from "../types.js";
import {
  NotFoundError,
  TimeoutError,
  CancelledError,
  ParseError,
  NoResultError,
  NonZeroExitError,
} from "../errors.js";
import type {
  OllamaRunnerConfig,
  OllamaRunOptions,
  FetchFn,
} from "./options.js";
import type {
  ChatRequest,
  ChatMessage,
  ChatResponse,
  ModelOptions,
} from "./types.js";

const DEFAULT_BASE_URL = "http://localhost:11434";

/** Create an Ollama runner. */
export function createOllamaRunner(config: OllamaRunnerConfig = {}): Runner {
  const baseURL = config.baseURL ?? DEFAULT_BASE_URL;
  const fetchFn: FetchFn = config.fetch ?? fetch;

  return {
    start: (prompt, options) =>
      start(config, fetchFn, baseURL, prompt, options as OllamaRunOptions),
    run: (prompt, options) =>
      run(config, fetchFn, baseURL, prompt, options as OllamaRunOptions),
    runStream: (prompt, options) =>
      runStream(config, fetchFn, baseURL, prompt, options as OllamaRunOptions),
  };
}

function start(
  config: OllamaRunnerConfig,
  fetchFn: FetchFn,
  baseURL: string,
  prompt: string,
  options: OllamaRunOptions = {},
): Session {
  const { signal, clearTimeout: clearTO } = combinedSignal(options);
  const abortController = new AbortController();

  // Chain: if the combined signal fires, abort the controller too.
  signal.addEventListener("abort", () => abortController.abort(signal.reason), {
    once: true,
  });

  let resolveResult: (value: Result) => void;
  let rejectResult: (reason: unknown) => void;
  const resultPromise = new Promise<Result>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });

  async function* messageGenerator(): AsyncGenerator<Message> {
    try {
      const body = buildRequestBody(prompt, options);

      logRequest(config, baseURL);

      let resp: Response;
      try {
        resp = await fetchFn(`${baseURL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: abortController.signal,
        });
      } catch (err) {
        // Check if this was caused by our signal (timeout or cancel).
        if (signal.aborted) {
          throw abortError(signal);
        }
        throw mapFetchError(err);
      }

      if (resp.status === 404) {
        throw new NotFoundError("model not found (HTTP 404)");
      }
      if (!resp.ok) {
        throw new NonZeroExitError(resp.status, `HTTP ${resp.status}`);
      }

      if (!resp.body) {
        throw new NoResultError();
      }

      const nodeStream = Readable.fromWeb(
        resp.body as import("node:stream/web").ReadableStream,
      );
      const rl = createInterface({ input: nodeStream });

      const textParts: string[] = [];
      let finalResp: ChatResponse | undefined;

      for await (const line of rl) {
        if (abortController.signal.aborted) break;
        if (!line) continue;

        let chunk: ChatResponse;
        try {
          chunk = JSON.parse(line) as ChatResponse;
        } catch {
          throw new ParseError(`invalid JSON: ${line}`);
        }

        if (chunk.message.content) {
          textParts.push(chunk.message.content);
        }

        if (chunk.done) {
          finalResp = chunk;
        }

        const msg: Message = {
          type: chunk.done ? "result" : "assistant",
          raw: line,
        };

        if (options.onMessage) {
          options.onMessage(msg);
        }

        yield msg;
      }

      clearTO();

      if (abortController.signal.aborted) {
        const err = abortError(signal);
        rejectResult!(err);
        return;
      }

      if (!finalResp) {
        rejectResult!(new NoResultError());
        return;
      }

      const usage: Usage = {
        inputTokens: finalResp.prompt_eval_count ?? 0,
        outputTokens: finalResp.eval_count ?? 0,
        cacheCreationInputTokens: 0,
        cacheReadInputTokens: 0,
      };

      resolveResult!({
        text: textParts.join(""),
        isError: false,
        exitCode: 0,
        usage,
        costUSD: 0,
        durationMs: finalResp.total_duration
          ? Math.floor(finalResp.total_duration / 1e6)
          : 0,
        sessionId: "",
      });
    } catch (err) {
      clearTO();
      if (err instanceof NotFoundError || err instanceof NonZeroExitError || err instanceof ParseError || err instanceof NoResultError) {
        rejectResult!(err);
        return;
      }
      rejectResult!(mapFetchError(err));
    }
  }

  const messages = messageGenerator();

  return {
    messages,
    result: resultPromise,
    abort: () => {
      abortController.abort("cancelled");
    },
    send: () => {
      throw new Error("not yet supported");
    },
  };
}

async function run(
  config: OllamaRunnerConfig,
  fetchFn: FetchFn,
  baseURL: string,
  prompt: string,
  options: OllamaRunOptions = {},
): Promise<Result> {
  const session = start(config, fetchFn, baseURL, prompt, options);

  for await (const _msg of session.messages) {
    // consumed
  }

  return session.result;
}

async function* runStream(
  config: OllamaRunnerConfig,
  fetchFn: FetchFn,
  baseURL: string,
  prompt: string,
  options: OllamaRunOptions = {},
): AsyncGenerator<Message> {
  const session = start(config, fetchFn, baseURL, prompt, options);
  yield* session.messages;

  // Propagates timeout/cancel/parse errors to the stream consumer.
  await session.result;
}

function buildRequestBody(
  prompt: string,
  options: OllamaRunOptions,
): ChatRequest {
  const messages = buildMessages(prompt, options);

  const req: ChatRequest = {
    model: options.model ?? "",
    messages,
    stream: true,
  };

  if (options.think != null) {
    req.think = options.think;
  }
  if (options.format) {
    req.format = options.format;
  }
  if (options.keepAlive) {
    req.keep_alive = options.keepAlive;
  }

  const modelOpts = buildModelOptions(options);
  if (modelOpts) {
    req.options = modelOpts;
  }

  return req;
}

function buildMessages(
  prompt: string,
  options: OllamaRunOptions,
): ChatMessage[] {
  const messages: ChatMessage[] = [];

  let systemPrompt = options.systemPrompt ?? "";
  if (options.appendSystemPrompt) {
    if (systemPrompt) {
      systemPrompt += "\n" + options.appendSystemPrompt;
    } else {
      systemPrompt = options.appendSystemPrompt;
    }
  }

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  messages.push({ role: "user", content: prompt });
  return messages;
}

function buildModelOptions(options: OllamaRunOptions): ModelOptions | undefined {
  const hasAny =
    options.temperature != null ||
    options.numCtx != null ||
    options.numPredict != null ||
    options.seed != null ||
    options.stop != null ||
    options.topK != null ||
    options.topP != null ||
    options.minP != null;

  if (!hasAny) return undefined;

  const opts: ModelOptions = {};
  if (options.temperature != null) opts.temperature = options.temperature;
  if (options.numCtx != null) opts.num_ctx = options.numCtx;
  if (options.numPredict != null) opts.num_predict = options.numPredict;
  if (options.seed != null) opts.seed = options.seed;
  if (options.stop != null) opts.stop = options.stop;
  if (options.topK != null) opts.top_k = options.topK;
  if (options.topP != null) opts.top_p = options.topP;
  if (options.minP != null) opts.min_p = options.minP;
  return opts;
}

/** Combine timeout and user-provided signal into a single AbortSignal. */
function combinedSignal(
  options: OllamaRunOptions,
): { signal: AbortSignal; clearTimeout: () => void } {
  const signals: AbortSignal[] = [];
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  if (options.signal) {
    signals.push(options.signal);
  }

  if (options.timeout != null && options.timeout > 0) {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort("timeout"), options.timeout);
    signals.push(controller.signal);
  }

  if (signals.length === 0) {
    const controller = new AbortController();
    return { signal: controller.signal, clearTimeout: () => {} };
  }

  if (signals.length === 1) {
    return {
      signal: signals[0],
      clearTimeout: () => {
        if (timeoutId != null) clearTimeout(timeoutId);
      },
    };
  }

  const combined = AbortSignal.any(signals);
  return {
    signal: combined,
    clearTimeout: () => {
      if (timeoutId != null) clearTimeout(timeoutId);
    },
  };
}

function abortError(signal: AbortSignal): TimeoutError | CancelledError {
  if (signal.reason === "timeout") {
    return new TimeoutError("execution timed out");
  }
  return new CancelledError("execution cancelled");
}

function mapFetchError(err: unknown): Error {
  if (err instanceof TimeoutError || err instanceof CancelledError || err instanceof NotFoundError || err instanceof NonZeroExitError || err instanceof ParseError || err instanceof NoResultError) {
    return err;
  }

  if (err instanceof DOMException || (err instanceof Error && err.name === "AbortError")) {
    // Cannot distinguish timeout from cancel via DOMException alone;
    // caller must check the signal reason before calling mapFetchError.
    return new CancelledError("execution cancelled");
  }

  if (err instanceof TypeError) {
    // fetch throws TypeError for network errors (connection refused, DNS failure, etc.)
    return new NotFoundError(`connection failed: ${err.message}`);
  }

  return new NotFoundError(`request failed: ${err}`);
}

function logRequest(config: OllamaRunnerConfig, baseURL: string): void {
  if (!config.logger) return;
  config.logger.debug("executing Ollama API request", {
    method: "POST",
    url: `${baseURL}/api/chat`,
  });
}
