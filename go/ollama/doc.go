// Package ollama provides a Runner implementation for invoking Ollama models
// via the Ollama HTTP API. It implements the common Runner interface using
// POST /api/chat with streaming ndjson responses, enabling fully local/offline
// agent execution with locally-hosted models.
package ollama
