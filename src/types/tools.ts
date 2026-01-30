/**
 * 工具相关类型定义
 */

// 工具参数定义
export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: unknown;
  enum?: string[];
}

// 工具元数据
export interface ToolMetadata {
  name: string;
  description: string;
  parameters: ToolParameter[];
}

// 工具执行上下文
export interface ToolContext {
  workingDirectory: string;
  agent: unknown;
}

// 工具执行结果
export interface ToolResult {
  success: boolean;
  data: unknown;
  error?: string;
}

// 工具选项
export interface ToolOptions {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute: (params: Record<string, unknown>, context: ToolContext) => Promise<ToolResult>;
}
