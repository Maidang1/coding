/**
 * 命令执行工具
 */

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { BaseTool } from '../base.js';
import type { ToolResult, ToolContext } from '../../types/tools.js';

export class BashTool extends BaseTool {
  constructor() {
    super({
      name: 'Bash',
      description: '执行 shell 命令',
      parameters: [
        {
          name: 'command',
          type: 'string',
          description: '要执行的命令',
          required: true,
        },
        {
          name: 'timeout',
          type: 'number',
          description: '超时时间（毫秒）',
          required: false,
          default: 120000,
        },
      ],
    });
  }

  async execute(params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const command = String(params.command);
    const timeout = Number(params.timeout) || 120000;

    return new Promise((resolvePromise) => {
      const [cmd, ...args] = command.split(' ');

      const proc = spawn(cmd, args, {
        cwd: context.workingDirectory,
        shell: true,
        env: process.env,
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        proc.kill();
        resolvePromise({
          success: false,
          data: null,
          error: `命令执行超时（${timeout}ms）`,
        });
      }, timeout);

      proc.on('close', (code) => {
        clearTimeout(timeoutHandle);

        if (timedOut) {
          return;
        }

        if (code === 0) {
          resolvePromise({
            success: true,
            data: stdout || stderr,
          });
        } else {
          resolvePromise({
            success: false,
            data: null,
            error: stderr || stdout || `命令退出码: ${code}`,
          });
        }
      });

      proc.on('error', (error) => {
        clearTimeout(timeoutHandle);
        if (timedOut) {
          return;
        }
        resolvePromise({
          success: false,
          data: null,
          error: error.message,
        });
      });
    });
  }
}
