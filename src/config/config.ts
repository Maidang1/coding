/**
 * 配置加载和验证
 */

import type { AgentConfig } from "../types/agent.js";
import {
  DEFAULT_MODEL,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
} from "./constants.js";

/**
 * 加载环境变量
 */
function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
    AGENT_MODEL: process.env.AGENT_MODEL || DEFAULT_MODEL,
    AGENT_MAX_TOKENS:
      process.env.AGENT_MAX_TOKENS || String(DEFAULT_MAX_TOKENS),
    AGENT_TEMPERATURE:
      process.env.AGENT_TEMPERATURE || String(DEFAULT_TEMPERATURE),
  };
  return env;
}

/**
 * 验证配置
 */
function validateConfig(env: Record<string, string>): void {
  console.log("env", env);
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY 环境变量未设置，请在 .env 文件中配置");
  }

  if (!env.ANTHROPIC_API_KEY.startsWith("sk-ant-")) {
    throw new Error("ANTHROPIC_API_KEY 格式不正确");
  }

  const maxTokens = Number.parseInt(env.AGENT_MAX_TOKENS, 10);
  if (Number.isNaN(maxTokens) || maxTokens <= 0) {
    throw new Error("AGENT_MAX_TOKENS 必须是正整数");
  }

  const temperature = Number.parseFloat(env.AGENT_TEMPERATURE);
  if (Number.isNaN(temperature) || temperature < 0 || temperature > 1) {
    throw new Error("AGENT_TEMPERATURE 必须在 0 到 1 之间");
  }
}

/**
 * 加载 Agent 配置
 */
export function loadConfig(
  workingDirectory: string = process.cwd(),
): AgentConfig {
  const env = loadEnv();

  validateConfig({
    ...env,
    ANTHROPIC_API_KEY:
      "sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  });

  return {
    apiKey: env.ANTHROPIC_API_KEY,
    model: env.AGENT_MODEL,
    maxTokens: Number.parseInt(env.AGENT_MAX_TOKENS, 10),
    temperature: Number.parseFloat(env.AGENT_TEMPERATURE),
    workingDirectory,
  };
}
