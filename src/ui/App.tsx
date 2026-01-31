/** @jsxImportSource react */
import React from "react";
import { Box, Text, useApp, useInput } from "ink";

export const App: React.FC = () => {
  const { exit } = useApp();

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">
        Claude CLI Agent
      </Text>
      <Text dimColor>Press Ctrl+C to exit</Text>
    </Box>
  );
};
