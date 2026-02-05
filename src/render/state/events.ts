import { atom } from "jotai";
import { globalStore } from "./store";

export type UiMode = "input" | "timeline";

type BaseEvent = {
  id: string;
  ts: string;
  expanded?: boolean;
};

export type ChatEvent = BaseEvent & {
  type: "chat";
  role: "user" | "assistant" | "system";
  content: string;
};

export type ToolEvent = BaseEvent & {
  type: "tool";
  toolUseId: string;
  toolName: string;
  status: "pending" | "done";
  preview?: string;
  input?: unknown;
  result?: string;
  filesChanged?: string[];
};

export type ConfirmEvent = BaseEvent & {
  type: "confirm";
  confirmId: string;
  toolName: string;
  reason: string;
  preview?: string;
  resolved?: boolean;
  allowed?: boolean;
};

export type McpEvent = BaseEvent & {
  type: "mcp";
  message: string;
  level?: "info" | "warn" | "error";
};

export type ErrorEvent = BaseEvent & {
  type: "error";
  message: string;
  stack?: string;
};

export type UiEvent = ChatEvent | ToolEvent | ConfirmEvent | McpEvent | ErrorEvent;

export const eventsAtom = atom<UiEvent[]>([]);

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function clearEvents(): void {
  globalStore.set(eventsAtom, []);
}

export function addEvent(event: UiEvent): void {
  const current = globalStore.get(eventsAtom);
  globalStore.set(eventsAtom, [...current, event]);
}

export function addChatEvent(params: { role: ChatEvent["role"]; content: string; id?: string }): string {
  const id = params.id ?? newId("chat");
  addEvent({ id, ts: nowIso(), type: "chat", role: params.role, content: params.content });
  return id;
}

export function appendChatContent(params: { id: string; delta: string }): void {
  const current = globalStore.get(eventsAtom);
  const next = current.map((e) => {
    if (e.type !== "chat") return e;
    if (e.id !== params.id) return e;
    return { ...e, content: e.content + params.delta };
  });
  globalStore.set(eventsAtom, next);
}

export function addToolEvent(params: {
  toolUseId: string;
  toolName: string;
  input?: unknown;
  preview?: string;
}): string {
  const id = newId("tool");
  addEvent({
    id,
    ts: nowIso(),
    type: "tool",
    toolUseId: params.toolUseId,
    toolName: params.toolName,
    status: "pending",
    input: params.input,
    preview: params.preview,
    expanded: false,
  });
  return id;
}

export function completeToolEvent(params: {
  toolUseId: string;
  result: string;
  filesChanged?: string[];
}): void {
  const current = globalStore.get(eventsAtom);
  const next = current.map((e) => {
    if (e.type !== "tool") return e;
    if (e.toolUseId !== params.toolUseId) return e;
    return { ...e, status: "done" as const, result: params.result, filesChanged: params.filesChanged };
  });
  globalStore.set(eventsAtom, next);
}

export function addConfirmEvent(params: {
  confirmId: string;
  toolName: string;
  reason: string;
  preview?: string;
}): string {
  const id = newId("confirm");
  addEvent({
    id,
    ts: nowIso(),
    type: "confirm",
    confirmId: params.confirmId,
    toolName: params.toolName,
    reason: params.reason,
    preview: params.preview,
    resolved: false,
    expanded: false,
  });
  return id;
}

export function resolveConfirmEvent(params: { confirmId: string; allowed: boolean }): void {
  const current = globalStore.get(eventsAtom);
  const next = current.map((e) => {
    if (e.type !== "confirm") return e;
    if (e.confirmId !== params.confirmId) return e;
    return { ...e, resolved: true, allowed: params.allowed };
  });
  globalStore.set(eventsAtom, next);
}

export function addMcpEvent(message: string, level: McpEvent["level"] = "info"): void {
  addEvent({ id: newId("mcp"), ts: nowIso(), type: "mcp", message, level });
}

export function addErrorEvent(params: { message: string; stack?: string }): void {
  addEvent({ id: newId("error"), ts: nowIso(), type: "error", message: params.message, stack: params.stack, expanded: false });
}

export function toggleExpanded(eventId: string): void {
  const current = globalStore.get(eventsAtom);
  const next = current.map((e) => {
    if (e.id !== eventId) return e;
    return { ...e, expanded: !e.expanded };
  });
  globalStore.set(eventsAtom, next);
}
