/**
 * Agent 相关类型定义
 */

// Agent 配置
export interface AgentConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  workingDirectory: string;
}

// Agent 状态
export type AgentState = 'idle' | 'thinking' | 'executing' | 'error';

// 消息角色
export type MessageRole = 'user' | 'assistant' | 'system';

// 消息类型
export interface Message {
  role: MessageRole;
  content: string;
  timestamp: number;
}

// 工具调用结果
export interface ToolCallResult {
  toolName: string;
  success: boolean;
  result: unknown;
  error?: string;
}

// Agent 响应
export interface AgentResponse {
  content: string;
  toolCalls: ToolCallResult[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
