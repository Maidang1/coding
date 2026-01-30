/**
 * REPL 主循环
 */

import type { Agent } from '../core/agent.js';
import type { Message } from '../types/agent.js';
import { Display } from './display.js';
import { Prompt } from './prompt.js';
import { InputHandler } from './input.js';

export class REPL {
  private agent: Agent;
  private inputHandler: InputHandler;
  private running = false;

  constructor(agent: Agent) {
    this.agent = agent;
    this.inputHandler = new InputHandler();
  }

  /**
   * 启动 REPL
   */
  async start(): Promise<void> {
    this.running = true;
    Display.showWelcome(this.agent.getConfig().workingDirectory);

    while (this.running) {
      try {
        await this.loop();
      } catch (error) {
        Display.showError(error);
      }
    }

    this.inputHandler.close();
  }

  /**
   * 主循环
   */
  private async loop(): Promise<void> {
    const prompt = Prompt.generate(this.agent.getMode());
    const input = await this.inputHandler.readLine(prompt);

    const trimmedInput = input.trim();

    // 空输入跳过
    if (!trimmedInput) {
      return;
    }

    // 处理特殊命令
    if (Prompt.isSpecialCommand(trimmedInput)) {
      await this.handleSpecialCommand(trimmedInput);
      return;
    }

    // 处理普通输入
    await this.handleNormalInput(trimmedInput);
  }

  /**
   * 处理特殊命令
   */
  private async handleSpecialCommand(input: string): Promise<void> {
    const command = Prompt.getSpecialCommand(input);

    if (command === Prompt.COMMANDS.EXIT) {
      this.running = false;
      Display.showExit();
    } else if (command === Prompt.COMMANDS.CLEAR) {
      this.agent.clearHistory();
      Display.showHistoryCleared();
    } else if (command === Prompt.COMMANDS.HELP) {
      Display.showHelp();
    } else if (command === Prompt.COMMANDS.HISTORY) {
      const history = this.agent.getHistory();
      Display.showHistory(
        history.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))
      );
    } else if (command === Prompt.COMMANDS.MODE) {
      const newMode = this.agent.toggleMode();
      Display.showModeChange(newMode);
    } else {
      Display.showError(`未知命令: ${command}`);
    }
  }

  /**
   * 处理普通输入
   */
  private async handleNormalInput(input: string): Promise<void> {
    try {
      Display.newLine();
      const response = await this.agent.process(input);
      Display.showAssistantMessage(response);
    } catch (error) {
      Display.showError(error);
    }
  }

  /**
   * 停止 REPL
   */
  stop(): void {
    this.running = false;
  }
}
