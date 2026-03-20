package ollama

// chatRequest is the request body for POST /api/chat.
type chatRequest struct {
	Model     string        `json:"model"`
	Messages  []chatMessage `json:"messages"`
	Stream    bool          `json:"stream"`
	Think     *bool         `json:"think,omitempty"`
	Options   *modelOptions `json:"options,omitempty"`
	Format    string        `json:"format,omitempty"`
	KeepAlive string        `json:"keep_alive,omitempty"`
}

// chatMessage is a single message in the chat history.
// The Thinking field carries reasoning content for thinking models (e.g. qwen3).
type chatMessage struct {
	Role     string `json:"role"`
	Content  string `json:"content"`
	Thinking string `json:"thinking,omitempty"`
}

// modelOptions holds Ollama model parameters.
// Pointer types for temperature, top_p, and min_p distinguish zero from unset.
type modelOptions struct {
	Temperature *float64 `json:"temperature,omitempty"`
	NumCtx      int      `json:"num_ctx,omitempty"`
	NumPredict  int      `json:"num_predict,omitempty"`
	Seed        int      `json:"seed,omitempty"`
	Stop        []string `json:"stop,omitempty"`
	TopK        int      `json:"top_k,omitempty"`
	TopP        *float64 `json:"top_p,omitempty"`
	MinP        *float64 `json:"min_p,omitempty"`
}

// chatResponse is a single ndjson line from the streaming /api/chat response.
// When done is true, the response includes timing and token statistics.
type chatResponse struct {
	Model             string      `json:"model"`
	CreatedAt         string      `json:"created_at"`
	Message           chatMessage `json:"message"`
	Done              bool        `json:"done"`
	DoneReason        string      `json:"done_reason,omitempty"`
	TotalDuration     int64       `json:"total_duration,omitempty"`
	LoadDuration      int64       `json:"load_duration,omitempty"`
	PromptEvalCount   int         `json:"prompt_eval_count,omitempty"`
	PromptEvalDuration int64      `json:"prompt_eval_duration,omitempty"`
	EvalCount         int         `json:"eval_count,omitempty"`
	EvalDuration      int64       `json:"eval_duration,omitempty"`
}
