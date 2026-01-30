/**
 * 常量定义
 */

// 默认配置
export const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';
export const DEFAULT_MAX_TOKENS = 4096;
export const DEFAULT_TEMPERATURE = 0.7;

// CLI 提示符
export const PROMPT_PREFIX = '>';
export const PROMPT_PLAN_PREFIX = 'plan>';

// 特殊命令
export const COMMAND_EXIT = '/exit';
export const COMMAND_CLEAR = '/clear';
export const COMMAND_HELP = '/help';
export const COMMAND_HISTORY = '/history';
export const COMMAND_MODE = '/mode';

// 颜色代码 (ANSI)
export const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
} as const;

// 帮助信息
export const HELP_MESSAGE = `
可用命令:
  /exit     退出程序
  /clear    清除对话历史
  /history  显示对话历史
  /mode     切换模式 (normal/plan)
  /help     显示此帮助信息

可用工具:
  Read      读取文件内容
  Write     写入文件
  Edit      编辑文件
  Glob      文件模式匹配
  Grep      内容搜索
  Bash      执行命令
`;
