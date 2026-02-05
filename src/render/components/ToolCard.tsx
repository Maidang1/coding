import React from "react";
import { Box, Text } from "ink";
import type { ToolEvent } from "../state/events";
import { COLORS } from "../theme";

function stringify(input: unknown): string {
  try {
    return JSON.stringify(input, null, 2);
  } catch {
    return String(input);
  }
}

function truncateLines(value: string, maxLines: number): { text: string; truncated: boolean } {
  const lines = value.split("\n");
  if (lines.length <= maxLines) return { text: value, truncated: false };
  return { text: lines.slice(0, maxLines).join("\n") + "\n…", truncated: true };
}

export function ToolCard(props: {
  event: ToolEvent;
  selected: boolean;
  mode: "input" | "timeline";
}): React.JSX.Element {
  const { event, selected, mode } = props;
  const statusColor = event.status === "done" ? COLORS.success : COLORS.warning;
  const summary = event.preview ?? (event.input ? truncateLines(stringify(event.input), 6).text : "(no input)");
  const selectedPrefix = selected && mode === "timeline" ? "▶ " : "";

  if (!event.expanded) {
    return (
      <Box>
        <Text dimColor color={COLORS.dim}>
          {selectedPrefix}🔧 {event.toolName}{" "}
        </Text>
        <Text color={statusColor}>[{event.status === "done" ? "done" : "pending"}]</Text>
        <Text color={COLORS.muted}> — {summary}</Text>
      </Box>
    );
  }

  const borderColor = selected && mode === "timeline" ? COLORS.accent : COLORS.border;

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={borderColor} paddingLeft={1} paddingRight={1}>
      <Box justifyContent="space-between">
        <Text bold color={COLORS.text}>
          {selectedPrefix}🔧 {event.toolName}
        </Text>
        <Text color={statusColor}>{event.status === "done" ? "done" : "pending"}</Text>
      </Box>

      {event.preview && (
        <Box>
          <Text color={COLORS.muted}>{event.preview}</Text>
        </Box>
      )}

      {event.input !== undefined && (
        <Box flexDirection="column" paddingTop={1}>
          <Text bold color={COLORS.accent}>
            Input
          </Text>
          <Text dimColor color={COLORS.dim}>{stringify(event.input)}</Text>
        </Box>
      )}

      {event.result !== undefined && (
        <Box flexDirection="column" paddingTop={1}>
          <Text bold color={COLORS.accent}>
            Result
          </Text>
          <Text dimColor color={COLORS.dim}>{event.result || "(empty)"}</Text>
        </Box>
      )}

      {!!event.filesChanged?.length && (
        <Box flexDirection="column" paddingTop={1}>
          <Text bold color={COLORS.accent}>
            Files Changed
          </Text>
          {event.filesChanged.map((f) => (
            <Text key={f} dimColor color={COLORS.dim}>
              - {f}
            </Text>
          ))}
        </Box>
      )}

      <Box paddingTop={1}>
        <Text dimColor color={COLORS.muted}>
          Enter/e: toggle details
        </Text>
      </Box>
    </Box>
  );
}
