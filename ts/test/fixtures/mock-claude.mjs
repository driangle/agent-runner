#!/usr/bin/env node
/**
 * Mock Claude CLI for testing. Reads MOCK_MODE env var to determine behavior.
 */
const mode = process.env.MOCK_MODE;

switch (mode) {
  case "happy":
    console.log(
      JSON.stringify({
        type: "system",
        subtype: "init",
        session_id: "sess-1",
        model: "claude-sonnet-4-6",
      }),
    );
    console.log(
      JSON.stringify({
        type: "assistant",
        message: {
          model: "claude-sonnet-4-6",
          id: "msg_01",
          content: [{ type: "text", text: "Hello world" }],
        },
      }),
    );
    console.log(
      JSON.stringify({
        type: "result",
        subtype: "success",
        result: "Hello world",
        is_error: false,
        total_cost_usd: 0.05,
        duration_ms: 1234,
        duration_api_ms: 1100,
        num_turns: 2,
        session_id: "sess-1",
        usage: {
          input_tokens: 100,
          output_tokens: 50,
          cache_creation_input_tokens: 10,
          cache_read_input_tokens: 20,
        },
      }),
    );
    break;

  case "error_result":
    console.log(
      JSON.stringify({
        type: "result",
        subtype: "error",
        result: "Something failed",
        is_error: true,
        session_id: "sess-err",
        usage: { input_tokens: 10, output_tokens: 5 },
      }),
    );
    break;

  case "no_result":
    console.log(
      JSON.stringify({
        type: "system",
        subtype: "init",
        session_id: "sess-x",
      }),
    );
    break;

  case "nonzero_exit":
    process.stderr.write("fatal error from claude\n");
    process.exit(1);
    break;

  case "stream_multi":
    console.log(
      JSON.stringify({
        type: "system",
        subtype: "init",
        session_id: "sess-s1",
        model: "claude-sonnet-4-6",
      }),
    );
    console.log(
      JSON.stringify({
        type: "stream_event",
        event: {
          type: "content_block_delta",
          index: 0,
          delta: { type: "text_delta", text: "Hello" },
        },
        session_id: "sess-s1",
      }),
    );
    console.log(
      JSON.stringify({
        type: "stream_event",
        event: {
          type: "content_block_delta",
          index: 0,
          delta: { type: "text_delta", text: " world" },
        },
        session_id: "sess-s1",
      }),
    );
    console.log(
      JSON.stringify({
        type: "assistant",
        message: {
          model: "claude-sonnet-4-6",
          id: "msg_01",
          content: [{ type: "text", text: "Hello world" }],
        },
      }),
    );
    console.log(
      JSON.stringify({
        type: "result",
        subtype: "success",
        result: "Hello world",
        is_error: false,
        total_cost_usd: 0.05,
        duration_ms: 500,
        session_id: "sess-s1",
        usage: { input_tokens: 100, output_tokens: 50 },
      }),
    );
    break;

  case "init_session_only":
    console.log(
      JSON.stringify({
        type: "system",
        subtype: "init",
        session_id: "sess-from-init",
        model: "claude-sonnet-4-6",
      }),
    );
    console.log(
      JSON.stringify({
        type: "result",
        subtype: "success",
        result: "done",
        is_error: false,
        total_cost_usd: 0.01,
        duration_ms: 100,
        usage: { input_tokens: 10, output_tokens: 5 },
      }),
    );
    break;

  case "slow":
    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log(
      JSON.stringify({
        type: "result",
        subtype: "success",
        result: "late",
        session_id: "sess-slow",
      }),
    );
    break;

  default:
    process.stderr.write("unknown mode: " + mode + "\n");
    process.exit(2);
}
