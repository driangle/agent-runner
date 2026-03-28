package claudecode

import (
	"context"
	"encoding/json"
	"os"
	"testing"
)

func TestSetupChannel(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping in short mode (requires go build)")
	}

	ctx := context.Background()
	co := &ClaudeOptions{ChannelEnabled: true}

	cs, err := setupChannel(ctx, co)
	if err != nil {
		t.Fatalf("setupChannel: %v", err)
	}
	defer cs.cleanup()

	// Verify socket path exists in temp dir.
	if cs.sockPath == "" {
		t.Fatal("sockPath is empty")
	}

	// Verify MCP config file was written.
	data, err := os.ReadFile(cs.mcpConfigPath)
	if err != nil {
		t.Fatalf("reading MCP config: %v", err)
	}

	var cfg mcpConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		t.Fatalf("parsing MCP config: %v", err)
	}

	srv, ok := cfg.MCPServers["agentrunner-channel"]
	if !ok {
		t.Fatal("agentrunner-channel server not in MCP config")
	}
	if srv.Command == "" {
		t.Error("command is empty")
	}
	if srv.Env["AGENTRUNNER_CHANNEL_SOCK"] != cs.sockPath {
		t.Errorf("sock env = %q, want %q", srv.Env["AGENTRUNNER_CHANNEL_SOCK"], cs.sockPath)
	}
}

func TestSetupChannelMergesUserConfig(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping in short mode (requires go build)")
	}

	// Write a user MCP config with a custom server.
	userCfg := mcpConfig{
		MCPServers: map[string]mcpServerConfig{
			"my-server": {
				Command: "/usr/bin/my-server",
				Args:    []string{"--port", "8080"},
			},
		},
	}
	userFile, err := os.CreateTemp("", "user-mcp-*.json")
	if err != nil {
		t.Fatalf("creating temp file: %v", err)
	}
	defer os.Remove(userFile.Name())

	data, _ := json.Marshal(userCfg)
	userFile.Write(data)
	userFile.Close()

	ctx := context.Background()
	co := &ClaudeOptions{
		ChannelEnabled: true,
		MCPConfig:      userFile.Name(),
	}

	cs, err := setupChannel(ctx, co)
	if err != nil {
		t.Fatalf("setupChannel: %v", err)
	}
	defer cs.cleanup()

	// Read the merged config.
	merged, err := os.ReadFile(cs.mcpConfigPath)
	if err != nil {
		t.Fatalf("reading merged config: %v", err)
	}

	var cfg mcpConfig
	if err := json.Unmarshal(merged, &cfg); err != nil {
		t.Fatalf("parsing merged config: %v", err)
	}

	// Both servers should be present.
	if _, ok := cfg.MCPServers["agentrunner-channel"]; !ok {
		t.Error("agentrunner-channel server missing from merged config")
	}
	if srv, ok := cfg.MCPServers["my-server"]; !ok {
		t.Error("my-server missing from merged config")
	} else if srv.Command != "/usr/bin/my-server" {
		t.Errorf("my-server command = %q, want %q", srv.Command, "/usr/bin/my-server")
	}
}
