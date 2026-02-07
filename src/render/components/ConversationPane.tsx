import React from "react";
import { Box, Text } from "ink";
import type { ChatEvent } from "../state/events";
import { COLORS } from "../theme";

// TODO(ui-layout): Reserved for future split-pane mode; currently not wired to the primary app flow.

function roleColor(role: ChatEvent["role"]): string {
  switch (role) {
    case "user":
      return COLORS.info;
    case "assistant":
      return COLORS.text;
    case "system":
      return COLORS.warning;
  }
}

function roleLabel(role: ChatEvent["role"]): string {
  switch (role) {
    case "user":
      return "❯";
    case "assistant":
      return "●";
    case "system":
      return "◆";
  }
}

export function ConversationPane(props: {
  events: ChatEvent[];
  selectedEventId: string | null;
  focused: boolean;
}): React.JSX.Element {
  const { events, selectedEventId, focused } = props;

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={focused ? COLORS.focus : COLORS.border} paddingX={1} flexGrow={1}>
      <Text bold color={focused ? COLORS.focus : COLORS.accent}>
        Conversation
      </Text>
      {events.length === 0 && <Text dimColor color={COLORS.dim}>No conversation yet.</Text>}
      {events.map((event) => {
        const selected = selectedEventId === event.id;
        const color = roleColor(event.role);
        const lines = (event.content ?? "").split("\n");
        return (
          <Box key={event.id} flexDirection="column">
            <Box>
              <Text color={selected && focused ? COLORS.focus : color}>
                {selected && focused ? "▶ " : ""}
                {roleLabel(event.role)} {event.role}
              </Text>
            </Box>
            {lines.map((line, index) => (
              <Box key={`${event.id}-${index}`} paddingLeft={2}>
                <Text color={event.role === "assistant" ? COLORS.textSoft : color}>{line || " "}</Text>
              </Box>
            ))}
          </Box>
        );
      })}
    </Box>
  );
}
