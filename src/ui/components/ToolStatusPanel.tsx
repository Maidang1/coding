/** @jsxImportSource react */
import React from "react";
import { Box, Text } from "ink";

export interface ToolExecution {
  name: string;
  status: "pending" | "running" | "done" | "error";
  input: Record<string, unknown>;
}

export interface ToolStatusPanelProps {
  currentTool: ToolExecution | null;
  history: ToolExecution[];
  maxHistory?: number;
}

export const ToolStatusPanel: React.FC<ToolStatusPanelProps> = ({
  currentTool,
  history,
  maxHistory = 5,
}) => {
  const statusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "yellow";
      case "running":
        return "cyan";
      case "done":
        return "green";
      case "error":
        return "red";
      default:
        return "white";
    }
  };

  const truncateInput = (input: Record<string, unknown>): string => {
    const str = JSON.stringify(input);
    return str.length > 40 ? str.slice(0, 40) + "..." : str;
  };

  const recentHistory = history.slice(-maxHistory);

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="gray" padding={1}>
      <Text bold underline>
        Tool Status
      </Text>

      {currentTool && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold>Current:</Text>
          <Box>
            <Text color={statusColor(currentTool.status)}>● </Text>
            <Text>{currentTool.name}</Text>
            <Text dimColor> [{currentTool.status}]</Text>
          </Box>
          <Text dimColor>{truncateInput(currentTool.input)}</Text>
        </Box>
      )}

      {recentHistory.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold dimColor>
            Recent:
          </Text>
          {recentHistory.map((tool, index) => (
            <Box key={index}>
              <Text color={statusColor(tool.status)}>● </Text>
              <Text dimColor>{tool.name}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
