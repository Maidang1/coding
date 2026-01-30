/**
 * 格式化工具
 */

import { COLORS } from '../config/constants.js';

/**
 * 格式化错误消息
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${COLORS.red}${error.message}${COLORS.reset}`;
  }
  if (typeof error === 'string') {
    return `${COLORS.red}${error}${COLORS.reset}`;
  }
  return `${COLORS.red}Unknown error${COLORS.reset}`;
}

/**
 * 格式化成功消息
 */
export function formatSuccess(message: string): string {
  return `${COLORS.green}${message}${COLORS.reset}`;
}

/**
 * 格式化工具调用
 */
export function formatToolCall(toolName: string, params: Record<string, unknown>): string {
  const paramsStr = Object.entries(params)
    .map(([key, value]) => {
      const val = typeof value === 'string' ? `"${value}"` : String(value);
      return `${COLORS.cyan}${key}${COLORS.reset}=${val}`;
    })
    .join(', ');

  return `${COLORS.magenta}${toolName}${COLORS.reset}(${paramsStr})`;
}

/**
 * 格式化工具结果
 */
export function formatToolResult(result: unknown): string {
  const str = String(result);
  if (str.length > 200) {
    return `${COLORS.dim}${str.slice(0, 200)}...${COLORS.reset}`;
  }
  return `${COLORS.dim}${str}${COLORS.reset}`;
}

/**
 * 格式化标题
 */
export function formatTitle(title: string): string {
  return `${COLORS.bright}${COLORS.white}${title}${COLORS.reset}`;
}

/**
 * 格式化助手消息
 */
export function formatAssistantMessage(message: string): string {
  return `${COLORS.bright}${message}${COLORS.reset}`;
}

/**
 * 格式化用户消息
 */
export function formatUserMessage(message: string): string {
  return `${COLORS.dim}${message}${COLORS.reset}`;
}

/**
 * 格式化代码块
 */
export function formatCodeBlock(code: string, language = ''): string {
  return `\`\`\`${language}\n${code}\n\`\`\``;
}
