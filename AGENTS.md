# Repository Guidelines

## Project Structure & Module Organization

- `src/index.ts` - Entry point (loads the CLI app).
- `src/cli/` - CLI bootstrap (Ink render + wiring).
- `src/render/` - Ink UI components and Jotai state.
- `src/core/` - Core logic (agent, tools, MCP, skills, config, safety, logging).
- `docs/` - Architecture and planning notes.
- `test-e2e.ts` - End-to-end smoke checks for MCP/skills components.

## Build, Test, and Development Commands

- `bun install` - Install dependencies.
- `bun run start` - Run the CLI (`package.json` script).
- `bun --hot src/index.ts` - Run with hot reload (dev loop).
- `bunx tsc -p tsconfig.json --noEmit` - Typecheck (recommended before PRs).
- `bun run test-e2e.ts` - Run the E2E smoke script.

## Coding Style & Naming Conventions

- TypeScript + ESM (`"type": "module"`) with strict compiler settings (`tsconfig.json`).
- Match existing style: 2-space indentation, double quotes, and semicolons.
- Prefer explicit types and `import type` where appropriate; keep `any` localized.
- Keep layering intact: UI changes in `src/render/`, business logic in `src/core/`, and minimal glue in `src/cli/`.

## Testing Guidelines

- There is no dedicated unit-test runner configured yet; use `test-e2e.ts` for basic regression coverage.
- If adding unit tests, follow common conventions (`*.test.ts`) and keep tests near the module they cover.

## Commit & Pull Request Guidelines

- Use Conventional Commits. Current history uses `feat: ...`; also use `fix:`, `docs:`, `chore:`, etc.
- PRs should include: what/why summary, commands run (e.g. typecheck/E2E), and updated docs in `docs/` when behavior changes.
- For CLI/UX changes, include a short screenshot or pasted terminal output in the PR description.

## Configuration & Security Tips

- Prefer `.env` (gitignored) for secrets like `ANTHROPIC_API_KEY` and related runtime variables.
- Claude settings load from (highest priority first): `.claude/settings.local.json`, `.claude/settings.json`, then `~/.claude/settings.json`—avoid committing secrets to tracked config.
