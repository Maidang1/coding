# Architecture

## Project Structure

- `src/cli/` - CLI entry layer that renders the Ink app
- `src/render/` - UI layer with Ink components and Jotai state
- `src/core/` - Business logic layer
  - `agent/` - Streams Anthropic responses, tool calls, MCP integration
  - `config/` - Loads Claude settings with local > project > user priority
  - `tools/` - Tool base class and built-in Bash tool
  - `mcp/` - MCP server integration and tool wrapping
  - `skills/` - Skill loader/manager for extensible skill modules
  - `utils/` - Shared helpers

## Architectural Patterns

- Event-driven agent using EventEmitter to communicate with UI
- Streaming response handling for incremental updates
- Tool abstraction with MCP bridge for extensibility
- Jotai atoms for shared reactive state

## Configuration

- Config files: `~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`
- Priority: local > project > user
