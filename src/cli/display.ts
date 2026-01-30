/**
 * 输出显示
 */

import { COLORS } from '../config/constants.js';
import { formatError, formatSuccess } from '../utils/formatter.js';
import type { AgentState } from '../types/agent.js';

export class Display {
  /**
   * 显示欢迎消息
   */
  static showWelcome(workingDirectory: string): void {
    console.log(`${COLORS.bright}${COLORS.cyan}
╔════════════════════════════════════════════════════════════╗
║                    Coding Agent                           ║
║         基于 Claude AI 的终端编程助手                     ║
╚════════════════════════════════════════════════════════════╝
${COLORS.reset}`);

    console.log(`工作目录: ${COLORS.dim}${workingDirectory}${COLORS.reset}`);
    console.log(`输入 ${COLORS.cyan}/help${COLORS.reset} 查看可用命令\n`);
  }

  /**
   * 显示提示符
   */
  static showPrompt(mode: 'normal' | 'plan'): void {
    const prefix = mode === 'plan' ? 'plan>' : '>';
    process.stdout.write(`${COLORS.green}${prefix}${COLORS.reset} `);
  }

  /**
   * 显示助手消息
   */
  static showAssistantMessage(message: string): void {
    console.log(`\n${COLORS.bright}${COLORS.white}${message}${COLORS.reset}\n`);
  }

  /**
   * 显示用户消息
   */
  static showUserMessage(message: string): void {
    console.log(`${COLORS.dim}${message}${COLORS.reset}`);
  }

  /**
   * 显示工具调用
   */
  static showToolCall(toolName: string, params: Record<string, unknown>): void {
    console.log(`  ${COLORS.magenta}${toolName}${COLORS.reset}(${this.formatParams(params)})`);
  }

  /**
   * 显示工具结果
   */
  static showToolResult(result: unknown): void {
    const str = String(result);
    if (str.length > 300) {
      console.log(`    ${COLORS.dim}${str.slice(0, 300)}...${COLORS.reset}`);
    } else {
      console.log(`    ${COLORS.dim}${str}${COLORS.reset}`);
    }
  }

  /**
   * 显示错误
   */
  static showError(error: unknown): void {
    console.log(`${formatError(error)}\n`);
  }

  /**
   * 显示成功
   */
  static showSuccess(message: string): void {
    console.log(`${formatSuccess(message)}\n`);
  }

  /**
   * 显示帮助信息
   */
  static showHelp(): void {
    console.log(`
${COLORS.bright}${COLORS.cyan}可用命令:${COLORS.reset}
  ${COLORS.cyan}/exit${COLORS.reset}     退出程序
  ${COLORS.cyan}/clear${COLORS.reset}    清除对话历史
  ${COLORS.cyan}/history${COLORS.reset}  显示对话历史
  ${COLORS.cyan}/mode${COLORS.reset}     切换模式 (normal/plan)
  ${COLORS.cyan}/help${COLORS.reset}     显示此帮助信息

${COLORS.bright}${COLORS.cyan}可用工具:${COLORS.reset}
  ${COLORS.cyan}Read${COLORS.reset}      读取文件内容
  ${COLORS.cyan}Write${COLORS.reset}     写入文件
  ${COLORS.cyan}Edit${COLORS.reset}      编辑文件
  ${COLORS.cyan}Glob${COLORS.reset}      文件模式匹配
  ${COLORS.cyan}Grep${COLORS.reset}      内容搜索
  ${COLORS.cyan}Bash${COLORS.reset}      执行命令
`);
  }

  /**
   * 显示历史记录
   */
  static showHistory(messages: Array<{ role: string; content: string }>): void {
    console.log(`\n${COLORS.bright}${COLORS.cyan}对话历史:${COLORS.reset}\n`);

    for (const msg of messages) {
      const role = msg.role === 'user' ? '用户' : '助手';
      const roleColor = msg.role === 'user' ? COLORS.green : COLORS.blue;
      console.log(`${roleColor}[${role}]${COLORS.reset} ${msg.content}\n`);
    }
  }

  /**
   * 显示模式切换
   */
  static showModeChange(mode: 'normal' | 'plan'): void {
    console.log(`\n${COLORS.bright}${COLORS.cyan}模式已切换为: ${mode}${COLORS.reset}\n`);
  }

  /**
   * 显示历史已清除
   */
  static showHistoryCleared(): void {
    console.log(`\n${COLORS.green}对话历史已清除${COLORS.reset}\n`);
  }

  /**
   * 显示状态
   */
  static showState(state: AgentState): void {
    const stateMap: Record<AgentState, string> = {
      idle: `${COLORS.green}空闲${COLORS.reset}`,
      thinking: `${COLORS.yellow}思考中...${COLORS.reset}`,
      executing: `${COLORS.magenta}执行中...${COLORS.reset}`,
      error: `${COLORS.red}错误${COLORS.reset}`,
    };
    console.log(`${stateMap[state]}`);
  }

  /**
   * 显示退出消息
   */
  static showExit(): void {
    console.log(`\n${COLORS.green}再见！${COLORS.reset}\n`);
  }

  /**
   * 换行
   */
  static newLine(): void {
    console.log();
  }

  /**
   * 格式化参数
   */
  private static formatParams(params: Record<string, unknown>): string {
    return Object.entries(params)
      .map(([key, value]) => {
        const val = typeof value === 'string' ? `"${value}"` : String(value);
        return `${COLORS.cyan}${key}${COLORS.reset}=${val}`;
      })
      .join(', ');
  }
}
