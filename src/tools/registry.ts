/**
 * 工具注册表
 */

import type { ToolMetadata } from '../types/tools.js';
import type { BaseTool } from './base.js';

export class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map();

  /**
   * 注册工具
   */
  register(tool: BaseTool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`工具 ${tool.name} 已存在`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * 批量注册工具
   */
  registerAll(tools: BaseTool[]): void {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  /**
   * 获取工具
   */
  get(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  /**
   * 检查工具是否存在
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * 获取所有工具名称
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * 获取所有工具元数据
   */
  getAllMetadata(): ToolMetadata[] {
    return Array.from(this.tools.values()).map((tool) => tool.getMetadata());
  }

  /**
   * 取消注册工具
   */
  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * 清空所有工具
   */
  clear(): void {
    this.tools.clear();
  }

  /**
   * 获取工具数量
   */
  size(): number {
    return this.tools.size;
  }
}

// 全局工具注册表实例
export const toolRegistry = new ToolRegistry();
