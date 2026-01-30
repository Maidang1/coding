/**
 * 使用 ink 的 REPL 主循环
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { render } from 'ink';
import type { Agent } from '../core/agent.js';
import type { AgentState } from '../types/agent.js';
import { App } from '../ui/components.js';

export class InkREPL {
  private agent: Agent;
  private running = false;
  private unmount: (() => void) | null = null;

  constructor(agent: Agent) {
    this.agent = agent;
  }

  /**
   * 启动 REPL
   */
  async start(): Promise<void> {
    this.running = true;

    const AppWrapper = (): React.ReactElement => {
      const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
      const [showHelp, setShowHelp] = useState(false);
      const processingRef = useRef(false);

      useEffect(() => {
        const interval = setInterval(() => {
          // 定期检查状态变化
        }, 100);

        return () => {
          clearInterval(interval);
        };
      }, []);

      const handleSubmit = useCallback(async (input: string): Promise<void> => {
        if (processingRef.current) {
          return;
        }

        if (!this.running) {
          return;
        }

        // 处理特殊命令
        if (input.startsWith('/')) {
          await this.handleSpecialCommand(input, setMessages, setShowHelp);
          return;
        }

        // 处理普通输入
        processingRef.current = true;
        try {
          setMessages((prev) => [...prev, { role: 'user', content: input }]);
          const response = await this.agent.process(input);
          setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `错误: ${error instanceof Error ? error.message : String(error)}`,
            },
          ]);
        } finally {
          processingRef.current = false;
        }
      }, []);

      return (
        <App
          workingDirectory={this.agent.getConfig().workingDirectory}
          agentState={this.agent.getState()}
          mode={this.agent.getMode()}
          messages={messages}
          showHelp={showHelp}
          onSubmit={handleSubmit}
        />
      );
    };

    this.unmount = render(<AppWrapper />);
  }

  /**
   * 处理特殊命令
   */
  private async handleSpecialCommand(
    input: string,
    setMessages: React.Dispatch<React.SetStateAction<Array<{ role: string; content: string }>>>,
    setShowHelp: React.Dispatch<React.SetStateAction<boolean>>,
  ): Promise<void> {
    const command = input.trim();

    if (command === '/exit') {
      this.running = false;
      process.exit(0);
    } else if (command === '/clear') {
      this.agent.clearHistory();
      setMessages([]);
    } else if (command === '/help') {
      setShowHelp((prev) => !prev);
    } else if (command === '/history') {
      const history = this.agent.getHistory();
      setMessages(
        history.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))
      );
    } else if (command === '/mode') {
      this.agent.toggleMode();
    }
  }

  /**
   * 停止 REPL
   */
  stop(): void {
    this.running = false;
    if (this.unmount) {
      this.unmount();
      this.unmount = null;
    }
  }
}
