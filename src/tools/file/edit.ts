/**
 * 文件编辑工具
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { BaseTool } from '../base.js';
import type { ToolResult, ToolContext } from '../../types/tools.js';

export class EditTool extends BaseTool {
  constructor() {
    super({
      name: 'Edit',
      description: '使用精确字符串替换来编辑文件',
      parameters: [
        {
          name: 'file_path',
          type: 'string',
          description: '要编辑的文件路径',
          required: true,
        },
        {
          name: 'old_string',
          type: 'string',
          description: '要替换的旧内容',
          required: true,
        },
        {
          name: 'new_string',
          type: 'string',
          description: '替换后的新内容',
          required: true,
        },
        {
        name: 'replace_all',
        type: 'boolean',
        description: '是否替换所有匹配项（默认为 false，只替换第一个）',
        required: false,
        default: false,
        },
      ],
    });
  }

  async execute(params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const filePath = String(params.file_path);
    const oldString = String(params.old_string);
    const newString = String(params.new_string);
    const replaceAll = Boolean(params.replace_all);
    const resolvedPath = resolve(context.workingDirectory, filePath);

    if (!existsSync(resolvedPath)) {
      return {
        success: false,
        data: null,
        error: `文件不存在: ${resolvedPath}`,
      };
    }

    if (!oldString) {
      return {
        success: false,
        data: null,
        error: 'old_string 不能为空',
      };
    }

    try {
      let content = await readFile(resolvedPath, 'utf-8');

      if (!content.includes(oldString)) {
        return {
          success: false,
          data: null,
          error: '未找到要替换的内容',
        };
      }

      let newContent: string;
      if (replaceAll) {
        const occurrences = (content.match(new RegExp(oldString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        newContent = content.split(oldString).join(newString);
        return {
          success: true,
          data: `替换了 ${occurrences} 处`,
        };
      } else {
        newContent = content.replace(oldString, newString);
      }

      await writeFile(resolvedPath, newContent, 'utf-8');
      return {
        success: true,
        data: `文件已编辑: ${resolvedPath}`,
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
