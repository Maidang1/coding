/**
 * 消息构建器
 */

import type { Message, MessageRole } from '../types/agent.js';
import type { ToolMetadata } from '../types/tools.js';

export class MessageBuilder {
  private messages: Message[] = [];

  /**
   * 添加系统消息
   */
  addSystemMessage(content: string): this {
    this.messages.push({
      role: 'system',
      content,
      timestamp: Date.now(),
    });
    return this;
  }

  /**
   * 添加用户消息
   */
  addUserMessage(content: string): this {
    this.messages.push({
      role: 'user',
      content,
      timestamp: Date.now(),
    });
    return this;
  }

  /**
   * 添加助手消息
   */
  addAssistantMessage(content: string): this {
    this.messages.push({
      role: 'assistant',
      content,
      timestamp: Date.now(),
    });
    return this;
  }

  /**
   * 添加消息
   */
  addMessage(role: MessageRole, content: string): this {
    this.messages.push({
      role,
      content,
      timestamp: Date.now(),
    });
    return this;
  }

  /**
   * 添加多个消息
   */
  addMessages(messages: Message[]): this {
    this.messages.push(...messages);
    return this;
  }

  /**
   * 清空消息
   */
  clear(): this {
    this.messages = [];
    return this;
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
   * 构建系统提示词
   */
  static buildSystemPrompt(tools: ToolMetadata[]): string {
    const toolsList = tools
      .map((tool) => {
        const params = tool.parameters
          .map((p) => {
            const req = p.required ? '(必需)' : '(可选)';
            return `  - ${p.name}: ${p.type} - ${p.description} ${req}`;
          })
          .join('\n');

        return `
## ${tool.name}

${tool.description}

参数:
${params || '  无参数'}
`;
      })
      .join('\n');

    return `你是一个有用的编程助手。你可以使用以下工具来完成任务：

${toolsList}

## 工作规则

1. 在执行文件操作之前，先使用 Read 工具读取文件内容（如果存在）
2. 使用 Write 工具创建新文件
3. 使用 Edit 工具编辑现有文件，使用精确字符串替换
4. 使用 Glob 工具查找文件
5. 使用 Grep 工具在文件中搜索内容
6. 使用 Bash 工具执行命令

## 回答方式

- 使用简洁明了的语言回答问题
- 在回答问题时引用具体的代码位置（文件名:行号）
- 如果需要执行多个步骤，逐步执行并报告结果
`;
  }

  /**
   * 构建工具调用响应
   */
  static buildToolResponse(
    toolName: string,
    result: { success: boolean; data: unknown; error?: string }
  ): string {
    if (result.success) {
      const data = typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2);
      return `工具 ${toolName} 执行成功:\n${data}`;
    } else {
      return `工具 ${toolName} 执行失败: ${result.error}`;
    }
  }
}
