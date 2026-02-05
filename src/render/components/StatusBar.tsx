import React from "react";
import { Box, Text } from "ink";
import type { UiMode } from "../state/events";
import { COLORS } from "../theme";

export function StatusBar(props: { mode: UiMode; model: string; sessionId: string }): React.JSX.Element {
  const { mode, model, sessionId } = props;
  const hint =
    mode === "timeline"
      ? "TIMELINE: ↑/↓ select • Enter/e expand • i type • Esc toggle"
      : "INPUT: type • /help • Esc timeline • ↑/↓ history";

  return (
    <Box flexDirection="row" justifyContent="space-between">
      <Text dimColor color={COLORS.muted}>
        {hint}
      </Text>
      <Box>
        <Text color={COLORS.accent}>[{mode.toUpperCase()}]</Text>
        <Text dimColor color={COLORS.dim}>
          {" "}
          model:{model}
        </Text>
        <Text color={COLORS.orange}> session:{sessionId}</Text>
      </Box>
    </Box>
  );
}
