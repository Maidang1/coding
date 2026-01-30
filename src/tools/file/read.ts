/**
 * 文件读取工具
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { BaseTool } from '../base.js';
import type { ToolResult, ToolContext } from '../../types/tools.js';

export class ReadTool extends BaseTool {
  constructor() {
    super({
      name: 'Read',
      description: '读取文件内容',
      parameters: [
        {
          name: 'file_path',
          type: 'string',
          description: '要读取的文件路径（绝对路径或相对于工作目录的相对路径）',
          required: true,
        },
      ],
    });
  }

  async execute(params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const filePath = String(params.file_path);
    const resolvedPath = resolve(context.workingDirectory, filePath);

    if (!existsSync(resolvedPath)) {
      return {
        success: false,
        data: null,
        error: `文件不存在: ${resolvedPath}`,
      };
    }

    try {
      const content = await readFile(resolvedPath, 'utf-8');
      return {
        success: true,
        data: content,
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
