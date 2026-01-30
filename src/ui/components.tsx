/**
 * UI 组件
 */

import React, { type ReactNode } from "react";
import { Box, Text, useApp, useInput } from "ink";
import type { AgentState } from "../types/agent.js";

export interface AppProps {
  workingDirectory: string;
  agentState: AgentState;
  mode: "normal" | "plan";
  messages: Array<{ role: string; content: string }>;
  showHelp: boolean;
  onSubmit: (input: string) => void;
}

export function App({
  workingDirectory,
  agentState,
  mode,
  messages,
  showHelp,
  onSubmit,
}: AppProps): ReactNode {
  const { exit } = useApp();

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Header workingDirectory={workingDirectory} />
      <Box flexGrow={1} flexDirection="column" marginTop={1}>
        <Messages messages={messages} />
      </Box>
      <StatusIndicator state={agentState} marginTop={1} />
      <Prompt mode={mode} onSubmit={onSubmit} showHelp={showHelp} />
    </Box>
  );
}

function Header({ workingDirectory }: { workingDirectory: string }): ReactNode {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box
        borderStyle="double"
        borderColor="cyan"
        paddingX={2}
        marginBottom={1}
      >
        <Text bold color="cyan">
          Coding Agent - 基于 Claude AI 的终端编程助手
        </Text>
      </Box>
      <Box>
        <Text dimColor>工作目录: </Text>
        <Text dimColor>{workingDirectory}</Text>
      </Box>
      <Box>
        <Text dimColor>输入 </Text>
        <Text color="cyan">/help</Text>
        <Text dimColor> 查看可用命令 (Ctrl+C 退出)</Text>
      </Box>
    </Box>
  );
}

function Messages({
  messages,
}: {
  messages: Array<{ role: string; content: string }>;
}): ReactNode {
  return (
    <Box flexDirection="column">
      {messages.map((msg, index) => (
        <Message
          key={`msg-${index}-${msg.role}`}
          role={msg.role}
          content={msg.content}
        />
      ))}
    </Box>
  );
}

function Message({
  role,
  content,
}: {
  role: string;
  content: string;
}): ReactNode {
  const isUser = role === "user";
  const roleText = isUser ? "用户" : "助手";
  const color = isUser ? "green" : "blue";

  return (
    <Box marginBottom={1}>
      <Text color={color}>[{roleText}] </Text>
      <Text>{content}</Text>
    </Box>
  );
}

function StatusIndicator({ state }: { state: AgentState }): ReactNode {
  const stateMap: Record<AgentState, { text: string; color: string }> = {
    idle: { text: "空闲", color: "green" },
    thinking: { text: "思考中...", color: "yellow" },
    executing: { text: "执行中...", color: "magenta" },
    error: { text: "错误", color: "red" },
  };

  const { text, color } = stateMap[state];

  return (
    <Box>
      <Text color={color}>{text}</Text>
    </Box>
  );
}

function Prompt({
  mode,
  onSubmit,
  showHelp,
}: {
  mode: "normal" | "plan";
  onSubmit: (input: string) => void;
  showHelp: boolean;
}): ReactNode {
  const [input, setInput] = React.useState("");

  useInput((inputStr, key) => {
    if (key.return) {
      if (inputStr.trim()) {
        onSubmit(inputStr.trim());
      }
      setInput("");
    } else if (key.backspace || key.delete) {
      setInput((prev) => prev.slice(0, -1));
    } else if (inputStr) {
      setInput((prev) => prev + inputStr);
    }
  });

  if (showHelp) {
    return <HelpContent />;
  }

  const prefix = mode === "plan" ? "plan>" : ">";

  return (
    <Box marginTop={1}>
      <Text color="green">{prefix}</Text>
      <Text> </Text>
      <Text>{input}</Text>
      <Text inverse> </Text>
    </Box>
  );
}

function HelpContent(): ReactNode {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="cyan">
        可用命令:
      </Text>
      <Text> </Text>
      <Text color="cyan">/exit</Text>
      <Text> 退出程序</Text>
      <Text> </Text>
      <Text color="cyan">/clear</Text>
      <Text> 清除对话历史</Text>
      <Text> </Text>
      <Text color="cyan">/history</Text>
      <Text> 显示对话历史</Text>
      <Text> </Text>
      <Text color="cyan">/mode</Text>
      <Text> 切换模式 (normal/plan)</Text>
      <Text> </Text>
      <Text color="cyan">/help</Text>
      <Text> 显示此帮助信息</Text>
      <Box marginTop={1}>
        <Text bold color="cyan">
          可用工具:
        </Text>
      </Box>
      <Text> </Text>
      <Text color="cyan">Read</Text>
      <Text> 读取文件内容</Text>
      <Text> </Text>
      <Text color="cyan">Write</Text>
      <Text> 写入文件</Text>
      <Text> </Text>
      <Text color="cyan">Edit</Text>
      <Text> 编辑文件</Text>
      <Text> </Text>
      <Text color="cyan">Glob</Text>
      <Text> 文件模式匹配</Text>
      <Text> </Text>
      <Text color="cyan">Grep</Text>
      <Text> 内容搜索</Text>
      <Text> </Text>
      <Text color="cyan">Bash</Text>
      <Text> 执行命令</Text>
    </Box>
  );
}
