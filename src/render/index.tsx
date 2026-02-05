import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { Provider, useAtomValue } from "jotai";
import * as path from "path";
import { Agent } from "../core/agent";
import { getEffectiveConfig } from "../core/config";
import { Timeline } from "./components/Timeline";
import { StatusBar } from "./components/StatusBar";
import { runSlashCommand } from "./commands";
import { historyAtom } from "./state/history";
import { loadingAtom } from "./state/loading";
import { globalStore } from "./state/store";
import { COLORS } from "./theme";
import {
  addChatEvent,
  addConfirmEvent,
  addErrorEvent,
  addMcpEvent,
  addToolEvent,
  appendChatContent,
  completeToolEvent,
  eventsAtom,
  resolveConfirmEvent,
  toggleExpanded,
  type UiMode,
} from "./state/events";

const { model } = getEffectiveConfig();
const agent = new Agent({ model });

const PINK_PIG = `
    (\\   /)
     (◕‿◕)
   ~~~∧∧∧~~~
`;

function WelcomeHeader(): React.JSX.Element {
  const cwd = process.cwd();
  const projectName = path.basename(cwd);
  const columns = process.stdout.columns ?? 80;
  const compact = columns < 90;

  return (
    <Box flexDirection="column" paddingBottom={1}>
      <Box borderStyle="round" borderColor={COLORS.border} paddingX={2} paddingY={1} flexDirection="column">
        <Box justifyContent="space-between" flexWrap="wrap">
          <Box>
            <Text bold color={COLORS.accent}>
              Coding Agent
            </Text>
            <Text dimColor color={COLORS.muted}>
              {" "}
              v1.0.0
            </Text>
          </Box>
          <Text dimColor color={COLORS.muted}>
            Press <Text bold>Esc</Text> for timeline • <Text bold>/help</Text> for commands
          </Text>
        </Box>

        <Box paddingTop={1} flexDirection={compact ? "column" : "row"} flexWrap="wrap">
          <Box flexDirection="column" width={compact ? undefined : 34} paddingRight={compact ? 0 : 2}>
            <Text bold color={COLORS.text}>
              Welcome back
            </Text>
            <Box paddingTop={1}>
              <Text dimColor color={COLORS.accent}>
                {PINK_PIG}
              </Text>
            </Box>
            <Box paddingTop={1} flexDirection="column">
              <Text bold color={COLORS.text}>
                {projectName}
              </Text>
              <Text dimColor color={COLORS.muted}>
                {cwd}
              </Text>
              <Text dimColor color={COLORS.muted}>
                session: {agent.sessionId}
              </Text>
            </Box>
          </Box>

          <Box flexDirection="column" paddingTop={compact ? 1 : 0} paddingLeft={compact ? 0 : 2} flexGrow={1}>
            <Text bold color={COLORS.accent}>
              Getting started
            </Text>
            <Box flexDirection="column" paddingTop={1}>
              <Text color={COLORS.textSoft}>
                • <Text bold>/init</Text> — create `CLAUDE.md` for project instructions
              </Text>
              <Text color={COLORS.textSoft}>
                • <Text bold>/model &lt;name&gt;</Text> — switch model
              </Text>
            </Box>

            <Box paddingTop={1}>
              <Text bold color={COLORS.accent}>
                Shortcuts
              </Text>
            </Box>
            <Box flexDirection="column" paddingTop={1}>
              <Text color={COLORS.textSoft}>
                • <Text bold>Esc</Text> — toggle input/timeline
              </Text>
              <Text color={COLORS.textSoft}>
                • Timeline: <Text bold>↑/↓</Text> select • <Text bold>Enter</Text>/<Text bold>e</Text> expand •{" "}
                <Text bold>i</Text> type
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function separator(): React.JSX.Element {
  const columns = process.stdout.columns ?? 80;
  const line = "─".repeat(Math.max(20, Math.min(columns, 120)));
  return (
    <Text dimColor color={COLORS.dim}>
      {line}
    </Text>
  );
}

function isSelectableEvent(type: string): boolean {
  return type === "tool" || type === "confirm" || type === "mcp" || type === "error";
}

function App(): React.JSX.Element {
  const history = useAtomValue(historyAtom, { store: globalStore });
  const events = useAtomValue(eventsAtom, { store: globalStore });
  const loading = useAtomValue(loadingAtom, { store: globalStore });

  const [query, setQuery] = useState("");
  const [historyIndex, setHistoryIndex] = useState(0);
  const [mode, setMode] = useState<UiMode>("input");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [modelLabel, setModelLabel] = useState(agent.model);

  const [confirm, setConfirm] = useState<null | { id: string; toolName: string; reason: string; preview?: string }>(
    null,
  );

  const assistantEventIdRef = useRef<string | null>(null);

  const selectableEventIds = useMemo(() => {
    return events.filter((e) => isSelectableEvent(e.type)).map((e) => e.id);
  }, [events]);

  useEffect(() => {
    agent.init();
    return () => {
      agent.cleanupMcp?.();
    };
  }, []);

  useEffect(() => {
    const hasAnyChat = events.some((e) => e.type === "chat" && (e.role === "user" || e.role === "assistant"));
    if (hasAnyChat) setShowWelcome(false);
  }, [events]);

  useEffect(() => {
    if (mode !== "timeline") return;
    if (selectedEventId) return;
    if (!selectableEventIds.length) return;
    setSelectedEventId(selectableEventIds[selectableEventIds.length - 1] ?? null);
  }, [mode, selectableEventIds, selectedEventId]);

  useEffect(() => {
    const handleUserMessage = (message: { role: "user"; content: string }) => {
      addChatEvent({ role: "user", content: message.content });
      globalStore.set(loadingAtom, true);
    };

    const handleAssistantStart = (message: { role: "assistant"; content: string }) => {
      const id = addChatEvent({ role: "assistant", content: message.content });
      assistantEventIdRef.current = id;
    };

    const handleAssistantDelta = (delta: string) => {
      const id = assistantEventIdRef.current;
      if (!id) return;
      appendChatContent({ id, delta });
    };

    const handleAssistantEnd = () => {
      assistantEventIdRef.current = null;
      globalStore.set(loadingAtom, false);
    };

    const handleToolUse = (event: { toolUseId: string; toolName: string; input: unknown; preview?: string }) => {
      addToolEvent({ toolUseId: event.toolUseId, toolName: event.toolName, input: event.input, preview: event.preview });
    };

    const handleToolResult = (event: { toolUseId: string; toolName: string; result: string; filesChanged?: string[] }) => {
      completeToolEvent({ toolUseId: event.toolUseId, result: event.result, filesChanged: event.filesChanged });
    };

    const handleConfirmRequest = (request: { id: string; toolName: string; reason: string; preview?: string }) => {
      addConfirmEvent({ confirmId: request.id, toolName: request.toolName, reason: request.reason, preview: request.preview });
      setConfirm(request);
    };

    const handleMcpConnectStart = (serverName: string) => addMcpEvent(`Connecting: ${serverName}`, "info");
    const handleMcpConnectSuccess = (serverName: string, toolCount: number) =>
      addMcpEvent(`Connected: ${serverName} (tools: ${toolCount})`, "info");
    const handleMcpConnectError = (serverName: string, error: Error) =>
      addMcpEvent(`Connection error: ${serverName} — ${error.message}`, "error");
    const handleMcpReconnectAttempt = (serverName: string, attempt: number, maxRetries: number) =>
      addMcpEvent(`Reconnect: ${serverName} (${attempt}/${maxRetries})`, "warn");
    const handleMcpHealthCheck = (serverName: string, _latency: number, healthy: boolean) => {
      if (!healthy) addMcpEvent(`Health check failed: ${serverName}`, "warn");
    };
    const handleMcpCacheHit = (serverName: string) => addMcpEvent(`Cache hit: ${serverName}`, "info");

    const handleError = (error: Error) => addErrorEvent({ message: error.message, stack: error.stack });

    agent.on("userMessage", handleUserMessage);
    agent.on("assistantMessageStart", handleAssistantStart);
    agent.on("assistantMessageDelta", handleAssistantDelta);
    agent.on("assistantMessageEnd", handleAssistantEnd);
    agent.on("toolUse", handleToolUse);
    agent.on("toolResult", handleToolResult);
    agent.on("confirmRequest", handleConfirmRequest);
    agent.on("mcpServerConnectStart", handleMcpConnectStart);
    agent.on("mcpServerConnectSuccess", handleMcpConnectSuccess);
    agent.on("mcpServerConnectError", handleMcpConnectError);
    agent.on("mcpReconnectAttempt", handleMcpReconnectAttempt);
    agent.on("mcpHealthCheck", handleMcpHealthCheck);
    agent.on("mcpCacheHit", handleMcpCacheHit);
    agent.on("error", handleError);

    return () => {
      agent.off("userMessage", handleUserMessage);
      agent.off("assistantMessageStart", handleAssistantStart);
      agent.off("assistantMessageDelta", handleAssistantDelta);
      agent.off("assistantMessageEnd", handleAssistantEnd);
      agent.off("toolUse", handleToolUse);
      agent.off("toolResult", handleToolResult);
      agent.off("confirmRequest", handleConfirmRequest);
      agent.off("mcpServerConnectStart", handleMcpConnectStart);
      agent.off("mcpServerConnectSuccess", handleMcpConnectSuccess);
      agent.off("mcpServerConnectError", handleMcpConnectError);
      agent.off("mcpReconnectAttempt", handleMcpReconnectAttempt);
      agent.off("mcpHealthCheck", handleMcpHealthCheck);
      agent.off("mcpCacheHit", handleMcpCacheHit);
      agent.off("error", handleError);
    };
  }, []);

  useInput((input, key) => {
    if (confirm) {
      if (input.toLowerCase() === "y") {
        agent.confirmResponse(confirm.id, true);
        resolveConfirmEvent({ confirmId: confirm.id, allowed: true });
        setConfirm(null);
      } else if (input.toLowerCase() === "n" || key.escape) {
        agent.confirmResponse(confirm.id, false);
        resolveConfirmEvent({ confirmId: confirm.id, allowed: false });
        setConfirm(null);
      }
      return;
    }

    if (key.escape) {
      setMode((m) => (m === "input" ? "timeline" : "input"));
      return;
    }

    if (mode === "timeline") {
      if (!selectableEventIds.length) return;

      if (key.upArrow) {
        const currentIndex = selectedEventId ? selectableEventIds.indexOf(selectedEventId) : selectableEventIds.length;
        const nextIndex = Math.max(0, currentIndex - 1);
        setSelectedEventId(selectableEventIds[nextIndex] ?? null);
        return;
      }
      if (key.downArrow) {
        const currentIndex = selectedEventId ? selectableEventIds.indexOf(selectedEventId) : -1;
        const nextIndex = Math.min(selectableEventIds.length - 1, currentIndex + 1);
        setSelectedEventId(selectableEventIds[nextIndex] ?? null);
        return;
      }
      if (input === "i") {
        setMode("input");
        return;
      }
      if (input === "e" || key.return) {
        if (selectedEventId) toggleExpanded(selectedEventId);
        return;
      }
      return;
    }

    if (key.upArrow && history.length > 0) {
      const nextIndex = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(nextIndex);
      setQuery(history[nextIndex] || "");
      return;
    }
    if (key.downArrow) {
      const nextIndex = Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setQuery(history[nextIndex] || "");
      return;
    }
  });

  const handleSubmit = async () => {
    if (!query.trim() || loading || confirm) return;

    const currentQuery = query;
    setQuery("");
    setHistoryIndex(0);

    const currentHistory = globalStore.get(historyAtom);
    globalStore.set(historyAtom, [currentQuery, ...currentHistory].slice(0, 200));

    const handled = await runSlashCommand(
      {
        agent,
        setModelLabel,
        setShowWelcome,
        setMode,
        setSelectedEventId,
      },
      currentQuery,
    );
    if (handled) return;

    agent.runStream(currentQuery);
  };

  return (
    <Provider store={globalStore}>
      <Box flexDirection="column">
        {showWelcome && (
          <>
            <WelcomeHeader />
          </>
        )}

        <Timeline events={events} mode={mode} selectedEventId={selectedEventId} />

        {loading && (
          <Box paddingLeft={2}>
            <Text dimColor color={COLORS.muted}>
              Thinking…
            </Text>
          </Box>
        )}

        <Box paddingTop={1}>{separator()}</Box>

        <Box>
          <Text color={loading ? COLORS.dim : COLORS.text}>&gt; </Text>
          <TextInput
            placeholder={
              confirm
                ? "Confirm pending…"
                : mode === "timeline"
                  ? "TIMELINE mode (press i to type)"
                  : loading
                    ? "Waiting for response..."
                    : "Type a message or /help"
            }
            value={query}
            onChange={loading || confirm || mode === "timeline" ? () => {} : setQuery}
            onSubmit={handleSubmit}
          />
        </Box>

        <Box paddingTop={1}>
          <StatusBar mode={mode} model={modelLabel} sessionId={agent.sessionId} />
        </Box>
      </Box>
    </Provider>
  );
}

export { App };
