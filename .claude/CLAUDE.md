# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `bun run src/index.ts` - Run the application
- `bun --hot src/index.ts` - Run with hot reload for development

## Architecture Overview

This is an interactive AI coding assistant CLI built with Bun, Ink (React for CLI), and Anthropic's SDK. The application follows a layered architecture with clear separation of concerns.

### Directory Structure

- **`src/cli/`** - CLI entry layer. Contains the minimal startup code that renders the main App component using Ink.
- **`src/core/`** - Core business logic layer.
  - `agent/` - AI Agent core class that handles Anthropic API interactions, streaming responses, and tool/MCP management using an event-driven architecture.
  - `config/` - Configuration management for Claude settings (supports user, project, and local config with priority merging).
  - `tools/` - Tool system with abstract base class. Includes BashTool and extensible interface for adding custom tools.
  - `mcp/` - Model Context Protocol integration that wraps MCP tools into the unified Tool interface.
  - `skills/` - Skill loading system for loading skill modules from various scopes.
  - `utils/` - Utility functions for message creation and helpers.
- **`src/render/`** - UI/render layer using Ink (React for CLI).
  - `index.tsx` - Main App component that manages the CLI interface, user input, and message display.
  - `state/` - Jotai-based state management (messages, history, loading state).

### Application Flow

1. Entry: `src/cli/index.tsx` renders the App component
2. Initialization: App creates Agent instance and initializes MCP tools
3. Interaction: User input → Agent events → Anthropic API streaming → UI updates
4. Tool execution: Agent calls tools (Bash, MCP) and feeds results back to the conversation

### Key Architectural Patterns

- **Event-driven architecture**: Agent uses EventEmitter to communicate with the UI layer, enabling loose coupling
- **Streaming responses**: Supports real-time streaming from Anthropic API with delta updates for smooth UX
- **Tool system**: Abstract `Tool` base class allows adding custom tools. Built-in BashTool, extensible via MCP
- **MCP integration**: Loads and manages MCP servers (stdio/HTTP transports), wraps their tools as native Tool instances
- **State management**: Jotai atoms for global reactive state, accessible from both React components and non-React code

### Configuration

**Environment variables** (`.env`):
- `ANTHROPIC_API_KEY` - Anthropic API key
- `AGENT_MODEL` - Model name to use
- `ANTHROPIC_BASE_URL` - Custom API base URL
- `ANTHROPIC_AUTH_TOKEN` - Custom auth token

**Claude config files** (priority: local > project > user):
- `~/.claude/settings.json` - User-level configuration
- `.claude/settings.json` - Project-level configuration
- `.claude/settings.local.json` - Local configuration (highest priority)

**MCP servers** configuration format:
```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "package@latest"],
      "env": {},
      "cwd": "/path"
    }
  }
}
```

### Adding New Features

- **Add a new tool**: Extend the `Tool` abstract base class from `src/core/tools/base.ts`, implement `getSchema()` and `execute()` methods
- **Add MCP server**: Configure in `.claude/settings.json` under `mcpServers`
- **Add new state**: Create a new atom in `src/render/state/`
- **Add UI components**: Modify `src/render/index/index.tsx`
