import fs from "fs";
import path from "path";
import os from "os";

export type ClaudeSettings = {
  env?: Record<string, string>;
  model?: string;
  apiKeyHelper?: string;
  mcpServers?: Record<string, McpServerConfig>;
  safety?: {
    allowedWriteRoots?: string[];
    autoAllowedBashPrefixes?: string[];
  };
  logging?: {
    baseDir?: string;
  };
};

export type McpServerConfig = {
  // 传输方式配置
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  url?: string;
  headers?: Record<string, string>;

  // 启用/禁用控制
  enabled?: boolean; // 默认 true

  // 超时配置
  startupTimeoutSec?: number; // 启动超时（默认 30s）
  toolTimeoutSec?: number; // 工具调用超时（默认 60s）

  // 工具过滤
  enabledTools?: string[]; // 工具白名单
  disabledTools?: string[]; // 工具黑名单

  // 重连配置
  maxRetries?: number; // 最大重试次数（默认 3）
  retryDelay?: number; // 初始重试延迟（默认 1000ms）

  // 健康检查配置
  healthCheckInterval?: number; // 健康检查间隔（默认 60000ms）

  // 认证配置
  auth?: {
    type: "bearer" | "oauth" | "basic";
    token?: string;
    username?: string;
    password?: string;
  };
};

export type EffectiveConfig = {
  model: string;
  baseURL?: string;
  authToken?: string;
  apiKey?: string;
  mcpServers: Record<string, McpServerConfig>;
  safety?: ClaudeSettings["safety"];
  logging?: ClaudeSettings["logging"];
  sources: string[];
};

let cachedConfig: EffectiveConfig | null = null;

function readSettingsFile(filePath: string): ClaudeSettings | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as ClaudeSettings;
  } catch (error) {
    console.warn(`Failed to read settings file: ${filePath}`, error);
    return null;
  }
}

function mergeSettings(base: ClaudeSettings, next: ClaudeSettings): ClaudeSettings {
  return {
    ...base,
    ...next,
    env: {
      ...(base.env ?? {}),
      ...(next.env ?? {})
    },
    mcpServers: {
      ...(base.mcpServers ?? {}),
      ...(next.mcpServers ?? {})
    },
  };
}

function getSettingsPaths(cwd: string): string[] {
  const userSettings = path.join(os.homedir(), ".claude", "settings.json");
  const projectSettings = path.join(cwd, ".claude", "settings.json");
  const localSettings = path.join(cwd, ".claude", "settings.local.json");
  return [userSettings, projectSettings, localSettings];
}

function loadClaudeSettings(cwd: string): { settings: ClaudeSettings; sources: string[] } {
  const paths = getSettingsPaths(cwd);
  let merged: ClaudeSettings = {};
  const sources: string[] = [];

  for (const filePath of paths) {
    const settings = readSettingsFile(filePath);
    if (settings) {
      merged = mergeSettings(merged, settings);
      sources.push(filePath);
    }
  }

  return { settings: merged, sources };
}

function applyEnvFromSettings(settings: ClaudeSettings): void {
  const env = settings.env;
  if (!env) return;

  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function getEffectiveConfig(): EffectiveConfig {
  if (cachedConfig) return cachedConfig;

  const cwd = process.cwd();
  const { settings, sources } = loadClaudeSettings(cwd);
  applyEnvFromSettings(settings);

  const model = process.env.ANTHROPIC_MODEL ?? settings.model ?? "ark-code-latest";
  const baseURL = process.env.ANTHROPIC_BASE_URL;
  const authToken = process.env.ANTHROPIC_AUTH_TOKEN;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const mcpServers = settings.mcpServers ?? {};

  cachedConfig = { model, baseURL, authToken, apiKey, mcpServers, safety: settings.safety, logging: settings.logging, sources };
  return cachedConfig;
}
