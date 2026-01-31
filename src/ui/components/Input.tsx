/** @jsxImportSource react */
import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

export interface InputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

export const Input: React.FC<InputProps> = ({ value, onChange, onSubmit, placeholder = "" }) => {
  useInput((input, key) => {
    if (key.return && !key.shift) {
      onSubmit();
    } else if (key.return && key.shift) {
      onChange(value + "\n");
    } else if (key.backspace || key.delete) {
      onChange(value.slice(0, -1));
    } else if (!key.ctrl && !key.meta && input) {
      onChange(value + input);
    }
  });

  const displayValue = value || placeholder;
  const isPlaceholder = !value && placeholder;

  return (
    <Box>
      <Text bold color="yellow">{">"} </Text>
      <Text dimColor={isPlaceholder}>{displayValue}</Text>
    </Box>
  );
};
