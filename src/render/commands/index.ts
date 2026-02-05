import type { Agent } from "../../core/agent";
import { getEffectiveConfig } from "../../core/config";
import { addChatEvent, clearEvents } from "../state/events";
import { ensureClaudeMd } from "./init";

export type SlashCommandContext = {
  agent: Agent;
  setModelLabel: (model: string) => void;
  setShowWelcome: (value: boolean) => void;
  setMode: (mode: "input" | "timeline") => void;
  setSelectedEventId: (id: string | null) => void;
};

type SlashCommandHandler = (ctx: SlashCommandContext, args: string[]) => Promise<void> | void;

const HELP_TEXT = [
  "Shortcuts:",
  "- Esc: toggle INPUT/TIMELINE",
  "- TIMELINE: Up/Down select, Enter/e expand, i back to input",
  "- Confirm: y allow, n/Esc deny",
  "",
  "Commands:",
  "- /help",
  "- /clear",
  "- /model <name>",
  "- /session",
  "- /init",
].join("\n");

const handlers: Record<string, SlashCommandHandler> = {
  help: () => {
    addChatEvent({ role: "system", content: HELP_TEXT });
  },
  clear: (ctx) => {
    clearEvents();
    ctx.setShowWelcome(true);
    ctx.setMode("input");
    ctx.setSelectedEventId(null);
  },
  model: (ctx, args) => {
    const next = args.join(" ").trim();
    if (!next) {
      addChatEvent({ role: "system", content: `Current model: ${ctx.agent.model}` });
      return;
    }
    ctx.agent.model = next;
    ctx.setModelLabel(next);
    addChatEvent({ role: "system", content: `Switched model to: ${next}` });
  },
  session: (ctx) => {
    const config = getEffectiveConfig();
    const sources = config.sources.length ? config.sources.join("\n- ") : "(none)";
    const mcpCount = Object.keys(config.mcpServers ?? {}).length;
    addChatEvent({
      role: "system",
      content: [
        `sessionId: ${ctx.agent.sessionId}`,
        `model: ${ctx.agent.model}`,
        `mcpServers: ${mcpCount}`,
        `config sources:\n- ${sources}`,
      ].join("\n"),
    });
  },
  init: async (ctx) => {
    const result = await ensureClaudeMd(ctx.agent);
    addChatEvent({ role: "system", content: result.message });
  },
};

export function parseSlashCommand(input: string): { name: string; args: string[] } | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return null;
  const rest = trimmed.slice(1).trim();
  if (!rest) return { name: "help", args: [] };
  const parts = rest.split(/\s+/);
  const name = (parts.shift() ?? "").toLowerCase();
  return { name, args: parts };
}

export async function runSlashCommand(ctx: SlashCommandContext, input: string): Promise<boolean> {
  const parsed = parseSlashCommand(input);
  if (!parsed) return false;
  const handler = handlers[parsed.name];
  if (!handler) {
    addChatEvent({ role: "system", content: `Unknown command: /${parsed.name}. Try /help.` });
    return true;
  }
  await handler(ctx, parsed.args);
  return true;
}
