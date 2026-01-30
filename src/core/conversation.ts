/**
 * 对话管理
 */

import type { Message, MessageRole } from '../types/agent.js';
import type { ConversationHistoryItem, ConversationMode, ConversationStats } from '../types/conversation.js';

export class Conversation {
  private messages: Message[] = [];
  private mode: ConversationMode = 'normal';
  private readonly maxMessages = 100;

  /**
   * 添加消息
   */
  addMessage(role: MessageRole, content: string): void {
    this.messages.push({
      role,
      content,
      timestamp: Date.now(),
    });

    // 限制消息数量
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }

  /**
   * 获取所有消息
   */
  getMessages(): Message[] {
    return [...this.messages];
  }

  /**
   * 获取消息数量
   */
  size(): number {
    return this.messages.length;
  }

  /**
   * 清空对话
   */
  clear(): void {
    this.messages = [];
  }

  /**
   * 获取模式
   */
  getMode(): ConversationMode {
    return this.mode;
  }

  /**
   * 设置模式
   */
  setMode(mode: ConversationMode): void {
    this.mode = mode;
  }

  /**
   * 切换模式
   */
  toggleMode(): ConversationMode {
    this.mode = this.mode === 'normal' ? 'plan' : 'normal';
    return this.mode;
  }

  /**
   * 获取对话统计
   */
  getStats(): ConversationStats {
    const userMessages = this.messages.filter((m) => m.role === 'user').length;
    const assistantMessages = this.messages.filter((m) => m.role === 'assistant').length;

    return {
      totalMessages: this.messages.length,
      userMessages,
      assistantMessages,
      totalTokensUsed: 0, // 可以根据实际情况计算
    };
  }

  /**
   * 获取对话历史摘要
   */
  getHistorySummary(): ConversationHistoryItem {
    const stats = this.getStats();
    const summary = `${stats.userMessages} 用户消息, ${stats.assistantMessages} 助手消息`;

    return {
      id: Date.now().toString(),
      messages: this.getMessages(),
      timestamp: Date.now(),
      summary,
    };
  }

  /**
   * 格式化历史消息
   */
  formatHistory(): string {
    return this.messages
      .map((msg) => {
        const role = msg.role === 'user' ? '用户' : '助手';
        return `[${role}] ${msg.content}`;
      })
      .join('\n\n');
  }
}
