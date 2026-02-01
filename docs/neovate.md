# Neovate Code 项目架构与 Agent 设计分析（中文）

> 本文基于当前仓库实现（TypeScript/Node.js + Ink），从“Agent 的设计、能力、模块划分、以及这样设计的好处”四个角度做系统性拆解，便于二次开发与定制。

## 1. 项目定位与总体目标

Neovate Code 是一个“面向软件工程任务”的 AI Coding Agent CLI：

- **交互形态**：默认启动终端 TUI（Ink/React），也支持 `--quiet` 非交互模式（适合脚本/CI/IDE 集成）。
- **核心闭环**：解析用户意图 → 组装上下文与系统提示词 → 调用 LLM（可多 provider）→ 根据工具调用执行读写/命令/子代理 → 记录会话与可追溯日志 → 将结果以 UI/流式输出呈现。
- **扩展能力**：插件（hooks）、自定义 Slash Commands、Skills、以及 MCP 工具服务器。
- **安全与权限**：工具分级（read/write/ask 等），支持不同 approval mode（默认/autoEdit/yolo），并在 `bash` 等高风险工具中内置风险识别策略。

## 2. 顶层架构：UI 与执行侧解耦（UIBridge / NodeBridge + MessageBus）

项目采用“前端 UI（Ink）”与“执行侧（NodeBridge）”分离的架构，通过 **MessageBus + Transport** 做 RPC 与事件流，避免 UI 直接耦合执行细节。

### 2.1 数据流概览

```
src/cli.ts
  └─ parseArgs() + runNeovate()
       ├─ quiet mode:  DirectTransport + MessageBus → NodeBridge → 直接输出 stream-json/json/text
       └─ interactive: UIBridge + NodeBridge（DirectTransport 成对连接）
             ├─ UI: Ink(App) + Zustand store
             └─ Node: handlers 负责创建 Context、执行 Project.send、处理工具审批、会话等
```

### 2.2 这样设计的好处

- **UI 与能力演进互不阻塞**：UI 只关心状态与渲染；执行侧可独立扩展更多命令/工具/模型策略。
- **天然支持“静默模式/脚本化”**：同一套 NodeBridge handlers 可服务 TUI 与 quiet 模式。
- **更容易做远程化**：Transport 抽象允许未来切换为 WebSocket/HTTP 等，而不重写业务逻辑。

## 3. Agent 的核心设计：Project + runLoop（对话循环）+ Tools（工具系统）

从“调用模型并执行工具”的角度，核心路径可以理解为：

1. **Project** 负责一次“发送用户输入”的完整编排（system prompt、工具列表、上下文、日志、回调 hooks）。
2. **runLoop** 负责模型交互循环：构造 prompt → 发起请求 → 解析 tool_calls → 调用本地工具 → 将 tool_result 回注历史 → 直到得到最终答案或失败。
3. **Tools** 负责将本地能力以“函数工具”暴露给模型，并提供审批策略、参数 schema、以及 UI 展示结构（如 diff viewer、agent result）。

### 3.1 Project：一次请求的编排器（src/project.ts）

Project 的职责更像“会话级 Orchestrator”：

- 根据 Context 配置 **resolveTools**（read/ls/glob/grep/fetch/skill + write/edit/bash + todo + planMode + MCP）。
- 生成 **systemPrompt**（含工具使用策略、语言要求、output style、todo/plan/子代理策略等）。
- 组装 **LlmsContext**（项目上下文、额外目录、用户 prompt 相关信息）。
- 写入日志：
  - **JsonlLogger**：会话消息（含 tool use / tool result）落地到 session log。
  - **RequestLogger**：记录模型请求/响应/headers/chunks（便于 debug 与可追溯）。
- 通过插件 hooks 注入能力与观测点：`systemPrompt/tool/toolUse/toolResult/query/conversation/stop` 等。

**好处**：把“对话的一次执行”封装成可复用、可测、可插拔的单元；UI/commands/server/SDK 都可以复用同一条管线。

### 3.2 runLoop：对话循环与容错（src/loop.ts）

runLoop 典型处理：

- 维护 **History**（可压缩/可截断策略），避免上下文爆掉。
- 支持 **maxTurns**、错误重试（含指数退避）、取消（AbortSignal）。
- 统一事件回调：
  - `onMessage`：落地消息、驱动 UI。
  - `onToolUse/onToolResult`：工具调用与结果可被插件 hook 修改/观测。
  - `onToolApprove`：把“需要用户确认”的动作交给上层（UI 或 quiet 自动批准策略）。

**好处**：把 LLM 调用和工具执行抽象成“可靠的状态机”，更易做到稳定性与一致性。

### 3.3 History：消息归一化与自动压缩（src/history.ts）

History 负责：

- 统一消息结构（NormalizedMessage），支持多段 content（text / reasoning / tool_use / tool_result / image）。
- 生成 provider 需要的 `LanguageModelV3Message`。
- 根据 token usage 与模型 limit 触发压缩（`compression.ts` + `compact.ts`）。

**好处**：可控上下文成本，提升长对话稳定性，并为 UI 的“上下文分析/展示”提供基础。

## 4. 工具系统：内置工具 + 可配置禁用 + 审批模型 + UI 展示

### 4.1 工具解析与注册（src/tool.ts）

`resolveTools()` 的组合策略（简化）：

- **只读工具**：`read/ls/glob/grep/fetch`（以及可选 skill）。
- **写工具**（允许写时才启用）：`write/edit/bash`。
- **Todo 工具**：`todoWrite`（与 sessionId 绑定，存放在全局 config 下的 todos）。
- **后台 bash 工具**：`bashOutput/killBash`（配合 BackgroundTaskManager）。
- **Plan Mode 工具**：如 `ExitPlanMode`（用于 plan 流程切换）。
- **MCP 工具**：由 MCPManager 动态加载，命名为 `mcp__{server}__{tool}`。
- **Task（子代理）工具**：仅在特定模式/条件下提供，并且会把“可用工具列表”传给子代理用于过滤。

并且支持通过 config `tools: { [name]: boolean }` 统一禁用任意工具（包括插件注入的工具）。

### 4.2 工具审批：approvalMode + category + session override（src/project.ts）

Project 层将工具审批策略做成统一规则：

- `approvalMode=yolo`：除 “ask 类工具” 外基本自动批准。
- `category=read`：通常自动批准。
- `approvalMode=autoEdit`：写类工具可自动批准（并支持 session config 覆盖）。
- `SessionConfigManager` 支持为单次会话记忆批准过的工具（approvalTools）。
- 工具本身可通过 `needsApproval()` 做更细粒度决策（例如 plan 文件自动批准 edit）。

**好处**：把“安全与用户体验”做成可配置的策略层；既能在交互模式保护用户，也能在自动化场景提效。

### 4.3 bash 工具的安全设计（src/tools/bash.ts）

`bash` 工具额外做了风险控制（例如：禁用/高风险命令检测、命令替换检测、输出截断、超时、后台执行提示等）。

**好处**：将最危险的能力包在“可审计/可限流/可提示”的执行器里，降低误伤与供应链式风险。

## 5. 子代理（Subagent）系统：Task 工具 + AgentManager + Executor

### 5.1 为什么需要子代理

当主对话需要“探索式检索 / 多步骤研究 / 规划”时，让主 agent 直接进行大量搜索会造成：

- 主上下文被大量探索日志污染；
- 工具调用变多，主线程 UI 更难管理；
- 模型选择难以针对任务类型优化。

因此项目提供 **Task tool**：把复杂任务交给“专用子代理”一次性完成，并返回总结。

### 5.2 核心实现

- `src/tools/task.ts`：Task 工具对外暴露；负责：
  - 选择 `subagent_type`；
  - 将“可用工具列表”交给 AgentManager 做过滤；
  - 通过 MessageBus 把子代理的 `agent.progress` 流式事件转给 UI（用于 AgentProgress 面板）。
- `src/agent/agentManager.ts`：管理 AgentDefinition 的注册与加载：
  - 内置 agent：explore/general-purpose/plan/neovate-code-guide；
  - 插件注入 agent（plugin hook `agent`）；
  - 从全局/项目配置目录与 `.claude/agents` 读取 `.md` 定义；
  - 支持 Claude → Neovate 工具名映射（便于兼容/迁移）。
- `src/agent/executor.ts`：执行子代理：
  - 模型选择优先级：显式传入 > config.agent.{type}.model > agent 定义 > 全局 model；
  - 过滤工具（allowed/disallowed + wildcard）；
  - 使用 Project 的发送管线执行（保证日志、工具、审批一致）；
  - 触发插件 hook `subagentStop` 便于记录与扩展。

### 5.3 内置子代理的分工（src/agent/builtin/*）

- **explore**：只读、快速定位文件与结构（偏 `smallModel`）。
- **general-purpose**：通用研究型，适合“我不确定要搜哪里”的复杂问题。
- **plan**：专门用于 plan mode 的“方案设计与权衡”，只读 + 强约束输出格式。
- **neovate-code-guide**：当产品名为 neovate 时启用；优先通过 fetch 官方文档回答“工具如何使用”的问题。

**好处**：用“角色分工 + 工具白名单”同时解决质量与安全问题；也能用小模型处理探索以降低成本。

## 6. 扩展机制：Plugin / Skills / Slash Commands / MCP

### 6.1 插件系统（src/plugin.ts + src/context.ts）

插件由 Context.create 统一加载与应用：

- 插件来源：内置插件 + 全局 plugins + 项目 plugins + config.plugins + argv plugins。
- 插件可实现大量 hooks（配置、工具、系统提示词、provider、模型别名、node bridge handlers、telemetry 等）。
- PluginHookType 支持：`Series/SeriesLast/SeriesMerge/Parallel/First`。
- 插件强制顺序：`enforce=pre` → normal → `enforce=post`。

**好处**：把“定制点”系统性地暴露出来；让企业/个人用户能在不 fork 核心逻辑的情况下扩展能力。

### 6.2 Skills：可安装/可复用的工作流（src/skill.ts）

SkillManager 支持从多来源加载 `SKILL.md`（插件、config、全局、项目、`.claude/skills`），并提供：

- 技能元信息（name/description/path/source）
- 读取 skill body（front matter + body 分离）
- 安装技能（degit 拉取模板/仓库）

**好处**：把重复性的任务流程沉淀成“可分发的知识包”，降低团队协作成本。

### 6.3 Slash Commands：把技能/指令变成交互入口（src/slashCommand.ts + src/slash-commands）

SlashCommandManager 的加载顺序类似插件/skills：

1) builtin commands  
2) plugin commands  
3) global `.claude/commands`  
4) global `.{product}/commands`  
5) project `.claude/commands`  
6) project `.{product}/commands`  
7) skills（若同名命令不存在则注入）

builtin 里既有“纯 prompt”命令，也有 `local-jsx` 命令（例如 `/context` 使用 UI 直接展示 token breakdown）。

**好处**：将“复杂操作”封装成可 discover 的命令入口，同时复用同一套 Project/NodeBridge 能力。

### 6.4 MCP：外部工具生态（src/mcp.ts）

MCPManager 将 MCP server 暴露的工具接入本地工具系统：

- 支持异步初始化与连接状态管理（pending/connecting/connected/failed/...）。
- 拉取 server tools 后转成本地 Tool，并统一命名为 `mcp__{server}__{tool}`。
- destroy 负责清理 client，避免资源泄漏。

**好处**：把工具扩展从“改代码/写插件”下沉为“配置一个 MCP server”，快速接入外部能力（如浏览器、知识库、内部平台等）。

## 7. 模块划分（src/）与职责地图

下面按“模块 → 主要职责 → 代表性文件/目录 → 设计收益”给出一张速查表。

| 模块 | 主要职责 | 代表性位置 | 设计收益 |
|---|---|---|---|
| CLI 入口 | 参数解析、选择模式、启动 UI/quiet/子命令 | `src/cli.ts`, `src/index.ts` | 启动路径清晰，便于集成与测试 |
| Context / DI | 聚合配置、paths、plugin/mcp/skills/agents、全局数据 | `src/context.ts`, `src/paths.ts`, `src/config.ts` | 统一依赖注入点，扩展能力集中管理 |
| Project 编排 | 组装 prompt/tools/context，驱动 loop，写日志 | `src/project.ts` | 核心链路集中，复用性强 |
| 对话循环 | 调用模型、处理 tool calls、重试/取消/压缩 | `src/loop.ts`, `src/history.ts` | 稳定性与可观测性更强 |
| 工具系统 | 定义工具、审批、执行、输出展示 | `src/tool.ts`, `src/tools/*` | 能力边界明确，可控权限 |
| 子代理系统 | agent 定义/加载/执行/进度事件 | `src/agent/*` | 复杂任务外包，主上下文更干净 |
| 插件系统 | hooks + provider 扩展 + handlers 注入 | `src/plugin.ts`, `src/plugins/*` | 低侵入扩展，支持企业定制 |
| MCP 集成 | 连接 MCP servers，桥接工具 | `src/mcp.ts` | 生态扩展能力，减少 fork 成本 |
| Slash Commands | /命令体系，含 builtin/用户/项目/skills | `src/slashCommand.ts`, `src/slash-commands/*` | 可发现的能力入口，提高交互效率 |
| UI（Ink） | TUI 渲染、输入、审批弹窗、diff、plan、agent progress | `src/ui/*`, `src/ui/store.ts` | 丰富交互，提升可用性 |
| Bridge/RPC | UI 与 Node 执行侧通信（请求+事件） | `src/messageBus.ts`, `src/uiBridge.ts`, `src/nodeBridge.ts` | 解耦、可替换 transport、易扩展 |
| Providers/Models | 多 provider 模型解析、别名、thinking/variants | `src/provider/*` | 支持多厂商、多模型策略统一管理 |
| Commands（子命令） | `neovate config/mcp/skill/commit/...` 等 | `src/commands/*` | CLI 工具化能力扩展而不污染主链路 |

## 8. 总结：该架构“好”的关键点

1. **编排与执行分层清晰**：Project 负责编排，runLoop 负责循环，Tools 负责能力暴露与权限，UI/NodeBridge 负责展示与调度。
2. **扩展面足够大但不混乱**：插件 hooks + skills + slash commands + MCP，覆盖“代码扩展、配置扩展、生态扩展”三条路径。
3. **安全机制内建**：审批模式、工具分级、bash 风险识别 + 输出截断，能覆盖大部分误用风险。
4. **可观测与可追溯**：Jsonl 会话日志 + 请求日志 + hooks telemetry，为调试与审计打基础。
5. **成本/性能可控**：探索型任务用小模型，历史自动压缩，降低 token 压力与调用成本。

---

### 进一步建议（可选）

如果你希望我再补充一版“面向贡献者”的文档，我可以在本文基础上再加：

- 关键模块的时序图（interactive/quiet 两条路径）
- 常见扩展点的示例（写一个插件、写一个 skill、接一个 MCP server）
- 与测试/CI 的对应关系（Vitest、Biome、typecheck）
