/**
 * 文件写入工具
 */

import { writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import { BaseTool } from '../base.js';
import type { ToolResult, ToolContext } from '../../types/tools.js';

export class WriteTool extends BaseTool {
  constructor() {
    super({
      name: 'Write',
      description: '写入文件内容（会覆盖现有文件）',
      parameters: [
        {
          name: 'file_path',
          type: 'string',
          description: '要写入的文件路径（绝对路径或相对于工作目录的相对路径）',
          required: true,
        },
        {
          name: 'content',
          type: 'string',
          description: '要写入的内容',
          required: true,
        },
      ],
    });
  }

  async execute(params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const filePath = String(params.file_path);
    const content = String(params.content);
    const resolvedPath = resolve(context.workingDirectory, filePath);

    // 确保目录存在
    const dir = dirname(resolvedPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    try {
      await writeFile(resolvedPath, content, 'utf-8');
      return {
        success: true,
        data: `文件已写入: ${resolvedPath}`,
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
