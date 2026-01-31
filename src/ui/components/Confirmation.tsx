/** @jsxImportSource react */
import React from "react";
import { Box, Text, useInput } from "ink";

export interface ConfirmationProps {
  confirmation: {
    toolName: string;
    description: string;
  } | null;
  onConfirm: () => void;
  onReject: () => void;
}

export const Confirmation: React.FC<ConfirmationProps> = ({
  confirmation,
  onConfirm,
  onReject,
}) => {
  useInput((input) => {
    if (!confirmation) return;
    
    if (input === "y" || input === "Y") {
      onConfirm();
    } else if (input === "n" || input === "N") {
      onReject();
    }
  });

  if (!confirmation) {
    return null;
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="red" paddingX={1} paddingY={1}>
      <Text bold color="red">
        ⚠ Dangerous Operation
      </Text>
      <Box marginY={1}>
        <Text>Tool: </Text>
        <Text bold>{confirmation.toolName}</Text>
      </Box>
      <Box marginY={1}>
        <Text>{confirmation.description}</Text>
      </Box>
      <Box marginY={1}>
        <Text>
          Confirm? <Text bold color="green">(y)</Text> <Text bold color="red">(n)</Text>
        </Text>
      </Box>
    </Box>
  );
};
