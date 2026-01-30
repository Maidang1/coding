/**
 * Coding Agent 入口文件
 */

import { cwd } from 'node:process';
import { Agent } from './core/agent.js';
import { InkREPL } from './cli/ink-repl.js';
import { loadConfig } from './config/config.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  try {
    // 加载配置
    const config = loadConfig(cwd());
    logger.info('配置加载成功');

    // 创建 Agent
    const agent = new Agent(config);

    // 启动 REPL
    const repl = new InkREPL(agent);
    await repl.start();
  } catch (error) {
    logger.error(`启动失败: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// 启动应用程序
main().catch((error) => {
  console.error('未处理的错误:', error);
  process.exit(1);
});
