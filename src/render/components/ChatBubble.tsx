import React from "react";
import { Box, Text } from "ink";
import type { ChatEvent } from "../state/events";
import { COLORS } from "../theme";

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

export function ChatBubble(props: { event: ChatEvent }): React.JSX.Element {
  const { event } = props;
  const lines = (event.content ?? "").split("\n");
  const color = roleColor(event.role);

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={color}>{roleLabel(event.role)} </Text>
        <Text bold color={color}>
          {event.role}
        </Text>
      </Box>
      {lines.map((line, lineIndex) => (
        <Box key={lineIndex} paddingLeft={2}>
          <Text
            color={
              event.role === "assistant"
                ? COLORS.textSoft
                : event.role === "system"
                  ? COLORS.dim
                  : color
            }
          >
            {line || " "}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
