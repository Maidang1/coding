/**
 * 对话相关类型定义
 */

import type { Message } from './agent.js';

// 对话模式
export type ConversationMode = 'normal' | 'plan';

// 对话历史项
export interface ConversationHistoryItem {
  id: string;
  messages: Message[];
  timestamp: number;
  summary?: string;
}

// 对话统计
export interface ConversationStats {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  totalTokensUsed: number;
}
