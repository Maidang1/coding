import { AgentStateMachine, AgentState, type StateEvent } from "./state";
import type { ToolDefinition, ToolResult } from "../tools/types";
import { DangerLevel } from "../tools/types";

type Anthropic = any;

export interface Message {
  role: "user" | "assistant";
  content: string | Array<{
    type: "text" | "tool_use";
    text?: string;
    id?: string;
    name?: string;
    input?: Record<string, unknown>;
  }>;
}

export interface ToolExecutor {
  (input: Record<string, unknown>): Promise<ToolResult<unknown>>;
}

export interface AgentConfig {
  apiKey: string;
  model: string;
  tools: ToolDefinition[];
  toolExecutors: Record<string, ToolExecutor>;
  maxTokens?: number;
  systemPrompt?: string;
}

interface PendingToolCall {
  toolName: string;
  input: Record<string, unknown>;
}

export class Agent {
  private readonly config: AgentConfig;
  private readonly anthropic: Anthropic | null = null;
  private readonly stateMachine: AgentStateMachine;
  private messages: Message[] = [];
  private pendingToolCall: PendingToolCall | null = null;

  constructor(config: AgentConfig) {
    this.config = {
      maxTokens: 4096,
      systemPrompt: "You are a helpful coding assistant.",
      ...config,
    };
    this.stateMachine = new AgentStateMachine();
  }

  getState(): AgentState {
    return this.stateMachine.getCurrentState();
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  addUserMessage(content: string): void {
    this.messages.push({
      role: "user",
      content,
    });
  }

  addAssistantMessage(content: string): void {
    this.messages.push({
      role: "assistant",
      content,
    });
  }

  transition(event: StateEvent): boolean {
    return this.stateMachine.transition(event);
  }

  isToolSafe(toolName: string): boolean {
    const tool = this.config.tools.find((t) => t.name === toolName);
    if (!tool) return false;
    return tool.dangerLevel === DangerLevel.safe;
  }

  async executeTool(
    toolName: string,
    input: Record<string, unknown>
  ): Promise<ToolResult<unknown>> {
    const executor = this.config.toolExecutors[toolName];
    if (!executor) {
      return {
        success: false,
        error: `Unknown tool: ${toolName}`,
      };
    }

    try {
      const result = await executor(input);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: `Tool execution failed: ${message}`,
      };
    }
  }

  setPendingToolCall(toolName: string, input: Record<string, unknown>): void {
    this.pendingToolCall = { toolName, input };
  }

  getPendingToolCall(): PendingToolCall | null {
    return this.pendingToolCall ? { ...this.pendingToolCall } : null;
  }

  confirmToolExecution(): void {
    this.pendingToolCall = null;
  }

  rejectToolExecution(): void {
    this.pendingToolCall = null;
  }

  reset(): void {
    this.messages = [];
    this.pendingToolCall = null;
    this.stateMachine.reset();
  }

  async sendMessage(message: string): Promise<void> {
    this.addUserMessage(message);
    this.transition("user_message");
  }
}
