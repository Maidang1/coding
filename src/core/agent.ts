/**
 * Agent 主类
 */

import Anthropic from '@anthropic-ai/sdk';
import type { AgentConfig, AgentState, Message, MessageRole } from '../types/agent.js';
import type { ToolResult } from '../types/tools.js';
import type { ConversationMode } from '../types/conversation.js';
import { Conversation } from './conversation.js';
import { MessageBuilder } from './message-builder.js';
import { toolRegistry } from '../tools/registry.js';
import { ReadTool } from '../tools/file/read.js';
import { WriteTool } from '../tools/file/write.js';
import { EditTool } from '../tools/file/edit.js';
import { GlobTool } from '../tools/file/glob.js';
import { GrepTool } from '../tools/search/grep.js';
import { BashTool } from '../tools/command/bash.js';
import { logger } from '../utils/logger.js';

export class Agent {
  private config: AgentConfig;
  private client: Anthropic;
  private conversation: Conversation;
  private state: AgentState = 'idle';
  private messageBuilder: MessageBuilder;

  constructor(config: AgentConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
    this.conversation = new Conversation();
    this.messageBuilder = new MessageBuilder();

    // 注册默认工具
    this.registerDefaultTools();
  }

  /**
   * 注册默认工具
   */
  private registerDefaultTools(): void {
    toolRegistry.registerAll([
      new ReadTool(),
      new WriteTool(),
      new EditTool(),
      new GlobTool(),
      new GrepTool(),
      new BashTool(),
    ]);
  }

  /**
   * 获取状态
   */
  getState(): AgentState {
    return this.state;
  }

  /**
   * 获取配置
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * 获取对话模式
   */
  getMode(): ConversationMode {
    return this.conversation.getMode();
  }

  /**
   * 设置对话模式
   */
  setMode(mode: ConversationMode): void {
    this.conversation.setMode(mode);
  }

  /**
   * 切换对话模式
   */
  toggleMode(): ConversationMode {
    return this.conversation.toggleMode();
  }

  /**
   * 获取对话历史
   */
  getHistory(): Message[] {
    return this.conversation.getMessages();
  }

  /**
   * 清空对话
   */
  clearHistory(): void {
    this.conversation.clear();
  }

  /**
   * 添加消息
   */
  addMessage(role: MessageRole, content: string): void {
    this.conversation.addMessage(role, content);
  }

  /**
   * 处理用户输入
   */
  async process(input: string): Promise<string> {
    this.state = 'thinking';

    try {
      // 添加用户消息
      this.conversation.addMessage('user', input);

      // 构建消息
      const messages = this.buildMessages();

      // 调用 API
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      });

      // 获取响应内容
      const content = response.content[0];
      let assistantMessage = '';

      if (content.type === 'text') {
        assistantMessage = content.text;
      }

      // 处理工具调用
      const block = response.content.find((c) => c.type === 'tool_use');
      if (block && block.type === 'tool_use') {
        this.state = 'executing';
        const toolName = block.name;
        const tool = toolRegistry.get(toolName);

        if (tool) {
          logger.info(`调用工具: ${toolName}`);
          const result = await tool.safeExecute(block.input, {
            workingDirectory: this.config.workingDirectory,
            agent: this,
          });

          // 添加工具结果
          const toolResponse = MessageBuilder.buildToolResponse(toolName, result);
          assistantMessage += '\n\n' + toolResponse;

          // 继续对话
          if (result.success) {
            await this.continueConversation(assistantMessage);
          }
        } else {
          assistantMessage += `\n\n工具 ${toolName} 不存在`;
        }
      }

      // 添加助手消息
      this.conversation.addMessage('assistant', assistantMessage);

      this.state = 'idle';
      return assistantMessage;
    } catch (error) {
      this.state = 'error';
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(errorMsg);
      throw error;
    }
  }

  /**
   * 构建消息列表
   */
  private buildMessages(): Message[] {
    const builder = new MessageBuilder();

    // 添加系统消息
    const systemPrompt = MessageBuilder.buildSystemPrompt(toolRegistry.getAllMetadata());
    builder.addSystemMessage(systemPrompt);

    // 添加对话历史
    builder.addMessages(this.conversation.getMessages());

    return builder.getMessages();
  }

  /**
   * 继续对话（处理工具调用后）
   */
  private async continueConversation(previousResponse: string): Promise<void> {
    // 可以在这里实现多轮工具调用
    // 目前只调用一次工具
  }

  /**
   * 获取对话统计
   */
  getStats() {
    return this.conversation.getStats();
  }
}
