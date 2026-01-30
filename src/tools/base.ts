/**
 * 工具基类
 */

import type { ToolOptions, ToolContext, ToolResult, ToolMetadata } from '../types/tools.js';

export abstract class BaseTool implements ToolOptions {
  name: string;
  description: string;
  parameters: ToolOptions['parameters'];

  constructor(options: Omit<ToolOptions, 'execute'>) {
    this.name = options.name;
    this.description = options.description;
    this.parameters = options.parameters;
  }

  /**
   * 执行工具
   */
  abstract execute(params: Record<string, unknown>, context: ToolContext): Promise<ToolResult>;

  /**
   * 获取工具元数据
   */
  getMetadata(): ToolMetadata {
    return {
      name: this.name,
      description: this.description,
      parameters: this.parameters,
    };
  }

  /**
   * 验证参数
   */
  validateParams(params: Record<string, unknown>): { valid: boolean; error?: string } {
    const requiredParams = this.parameters.filter((p) => p.required);
    for (const param of requiredParams) {
      if (!(param.name in params) || params[param.name] === undefined || params[param.name] === null) {
        return { valid: false, error: `缺少必需参数: ${param.name}` };
      }
    }

    // 检查 enum 约束
    for (const param of this.parameters) {
      if (param.name in params && param.enum) {
        const value = params[param.name];
        if (typeof value === 'string' && !param.enum.includes(value)) {
          return {
            valid: false,
            error: `参数 ${param.name} 的值必须是以下之一: ${param.enum.join(', ')}`,
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * 安全执行
   */
  async safeExecute(params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    try {
      const validation = this.validateParams(params);
      if (!validation.valid) {
        return {
          success: false,
          data: null,
          error: validation.error,
        };
      }

      return await this.execute(params, context);
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
