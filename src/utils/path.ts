/**
 * 路径工具
 */

import { join, resolve, isAbsolute, relative } from 'node:path';

/**
 * 解析相对于工作目录的路径
 */
export function resolvePath(path: string, workingDirectory: string): string {
  if (isAbsolute(path)) {
    return resolve(path);
  }
  return resolve(workingDirectory, path);
}

/**
 * 获取相对路径
 */
export function getRelativePath(path: string, workingDirectory: string): string {
  return relative(workingDirectory, path);
}

/**
 * 解析多个路径
 */
export function resolvePaths(paths: string[], workingDirectory: string): string[] {
  return paths.map((path) => resolvePath(path, workingDirectory));
}

/**
 * 规范化路径
 */
export function normalizePath(path: string, workingDirectory: string): string {
  const resolved = resolvePath(path, workingDirectory);
  return getRelativePath(resolved, workingDirectory);
}
