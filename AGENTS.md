# AGENTS.md

This file provides guidance to neovate when working with code in this repository.

## WHY: Purpose and Goals

An interactive AI coding assistant CLI built with Bun and Ink that streams Anthropic responses, manages tools/MCP servers, and supports skill loading for extensibility.

## WHAT: Technical Stack

- Runtime/Language: Bun, TypeScript
- Framework: Ink (React for CLI)
- Key dependencies: @anthropic-ai/sdk, @modelcontextprotocol/sdk, jotai, zod

## HOW: Core Development Workflow

```bash
# Development
bun --hot src/index.ts

# Run
bun run src/index.ts
```

## Progressive Disclosure

For detailed information, consult these documents as needed:

- docs/agent/development_commands.md - All build, test, lint, release commands
- docs/agent/architecture.md - Module structure and architectural patterns

When working on a task, first determine which documentation is relevant, then read only those files.
