/**
 * 提示符处理
 */

import { COLORS } from '../config/constants.js';

export class Prompt {
  /**
   * 生成提示符
   */
  static generate(mode: 'normal' | 'plan'): string {
    const prefix = mode === 'plan' ? 'plan>' : '>';
    return `${COLORS.green}${prefix}${COLORS.reset} `;
  }

  /**
   * 解析输入
   */
  static parse(input: string): { command: string; args: string[] } {
    const parts = input.trim().split(/\s+/);
    const command = parts[0] || '';
    const args = parts.slice(1);
    return { command, args };
  }

  /**
   * 检查是否是特殊命令
   */
  static isSpecialCommand(input: string): boolean {
    const trimmed = input.trim();
    return trimmed.startsWith('/');
  }

  /**
   * 获取特殊命令类型
   */
  static getSpecialCommand(input: string): string | null {
    const { command } = this.parse(input);
    return command.startsWith('/') ? command : null;
  }

  /**
   * 特殊命令类型
   */
  static readonly COMMANDS = {
    EXIT: '/exit',
    CLEAR: '/clear',
    HELP: '/help',
    HISTORY: '/history',
    MODE: '/mode',
  } as const;
}
