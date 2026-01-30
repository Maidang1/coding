/**
 * 日志工具
 */

import { COLORS } from '../config/constants.js';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `${COLORS.dim}[${timestamp}]${COLORS.reset} ${level} ${message}`;
  }

  debug(message: string): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(this.formatMessage(`${COLORS.dim}DEBUG${COLORS.reset}`, message));
    }
  }

  info(message: string): void {
    if (this.level <= LogLevel.INFO) {
      console.log(this.formatMessage(`${COLORS.blue}INFO${COLORS.reset}`, message));
    }
  }

  warn(message: string): void {
    if (this.level <= LogLevel.WARN) {
      console.log(this.formatMessage(`${COLORS.yellow}WARN${COLORS.reset}`, message));
    }
  }

  error(message: string): void {
    if (this.level <= LogLevel.ERROR) {
      console.log(this.formatMessage(`${COLORS.red}ERROR${COLORS.reset}`, message));
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

export const logger = new Logger();
