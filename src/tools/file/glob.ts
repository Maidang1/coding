/**
 * 文件模式匹配工具
 */

import { resolve } from 'node:path';
import { glob as globFn } from 'glob';
import { BaseTool } from '../base.js';
import type { ToolResult, ToolContext } from '../../types/tools.js';

export class GlobTool extends BaseTool {
  constructor() {
    super({
      name: 'Glob',
      description: '使用 glob 模式匹配查找文件',
      parameters: [
        {
          name: 'pattern',
          type: 'string',
          description: 'glob 模式（如 **/*.ts, src/**/*.tsx）',
          required: true,
        },
      ],
    });
  }

  async execute(params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const pattern = String(params.pattern);

    try {
      const files = await globFn(pattern, {
        cwd: context.workingDirectory,
        absolute: true,
      });

      return {
        success: true,
        data: files,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
