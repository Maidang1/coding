/**
 * 内容搜索工具
 */

import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { glob as globFn } from 'glob';
import { BaseTool } from '../base.js';
import type { ToolResult, ToolContext } from '../../types/tools.js';

interface GrepResult {
  file: string;
  matches: Array<{
    line: number;
    content: string;
  }>;
}

export class GrepTool extends BaseTool {
  constructor() {
    super({
      name: 'Grep',
      description: '在文件中搜索内容',
      parameters: [
        {
          name: 'pattern',
          type: 'string',
          description: '要搜索的正则表达式模式',
          required: true,
        },
        {
          name: 'glob',
          type: 'string',
          description: '文件匹配模式（如 **/*.ts）',
          required: false,
        },
        {
          name: 'case_insensitive',
          type: 'boolean',
          description: '是否忽略大小写',
          required: false,
          default: false,
        },
      ],
    });
  }

  async execute(params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const pattern = String(params.pattern);
    const globPattern = params.glob ? String(params.glob) : '**/*';
    const caseInsensitive = Boolean(params.case_insensitive);

    try {
      const flags = caseInsensitive ? 'gi' : 'g';
      const regex = new RegExp(pattern, flags);

      const files = await globFn(globPattern, {
        cwd: context.workingDirectory,
        absolute: true,
        nodir: true,
      });

      const results: GrepResult[] = [];

      for (const file of files) {
        if (!existsSync(file)) {
          continue;
        }

        try {
          const content = await readFile(file, 'utf-8');
          const lines = content.split('\n');
          const matches: Array<{ line: number; content: string }> = [];

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (regex.test(line)) {
              matches.push({
                line: i + 1,
                content: line,
              });
            }
          }

          if (matches.length > 0) {
            results.push({
              file,
              matches,
            });
          }
        } catch {
          // 忽略读取错误的文件
        }
      }

      return {
        success: true,
        data: results,
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
