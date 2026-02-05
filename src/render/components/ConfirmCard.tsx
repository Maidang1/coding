import React from "react";
import { Box, Text } from "ink";
import type { ConfirmEvent } from "../state/events";
import { COLORS } from "../theme";

export function ConfirmCard(props: {
  event: ConfirmEvent;
  selected: boolean;
  mode: "input" | "timeline";
}): React.JSX.Element {
  const { event, selected, mode } = props;
  const selectedPrefix = selected && mode === "timeline" ? "▶ " : "";

  const status =
    event.resolved === true
      ? event.allowed
        ? { label: "allowed", color: COLORS.success }
        : { label: "denied", color: COLORS.danger }
      : { label: "pending", color: COLORS.warning };

  if (!event.expanded) {
    return (
      <Box>
        <Text color={COLORS.warning}>
          {selectedPrefix}⚠ Confirm{" "}
        </Text>
        <Text color={status.color}>[{status.label}]</Text>
        <Text color={COLORS.muted}> — {event.toolName}: {event.reason}</Text>
      </Box>
    );
  }

  const borderColor = selected && mode === "timeline" ? COLORS.warning : COLORS.border;

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={borderColor} paddingLeft={1} paddingRight={1}>
      <Box justifyContent="space-between">
        <Text bold color={COLORS.text}>
          {selectedPrefix}Confirm tool execution
        </Text>
        <Text color={status.color}>{status.label}</Text>
      </Box>

      <Box flexDirection="column">
        <Text color={COLORS.muted}>
          Tool: {event.toolName} • Reason: {event.reason}
        </Text>
        {event.preview && (
          <Box paddingTop={1}>
            <Text dimColor color={COLORS.dim}>{event.preview}</Text>
          </Box>
        )}
      </Box>

      <Box paddingTop={1} flexDirection="column">
        <Text color={COLORS.muted}>
          Press <Text bold>y</Text> to allow or <Text bold>n</Text>/<Text bold>Esc</Text> to deny.
        </Text>
        <Text dimColor color={COLORS.muted}>
          Enter/e: toggle details
        </Text>
      </Box>
    </Box>
  );
}
