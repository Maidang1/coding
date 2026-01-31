import { test, expect, describe, beforeEach } from "bun:test";
import { Agent } from "../../core/agent";
import { AgentState } from "../../core/state";
import type { ToolDefinition } from "../../tools/types";
import { DangerLevel } from "../../tools/types";

describe("Agent", () => {
  let agent: Agent;
  const mockApiKey = "test-api-key";

  const mockSafeTool: ToolDefinition = {
    name: "mock_safe_tool",
    description: "A safe tool for testing",
    input_schema: {
      type: "object" as const,
      properties: {
        input: { type: "string" },
      },
      required: ["input"],
    },
    dangerLevel: DangerLevel.safe,
  };

  const mockDangerousTool: ToolDefinition = {
    name: "mock_dangerous_tool",
    description: "A dangerous tool for testing",
    input_schema: {
      type: "object" as const,
      properties: {
        command: { type: "string" },
      },
      required: ["command"],
    },
    dangerLevel: DangerLevel.dangerous,
  };

  beforeEach(() => {
    agent = new Agent({
      apiKey: mockApiKey,
      model: "claude-3-5-sonnet-20241022",
      tools: [mockSafeTool, mockDangerousTool],
      toolExecutors: {
        mock_safe_tool: async (input) => ({
          success: true,
          data: `Safe result: ${input.input}`,
        }),
        mock_dangerous_tool: async (input) => ({
          success: true,
          data: `Dangerous result: ${input.command}`,
        }),
      },
    });
  });

  describe("initialization", () => {
    test("should initialize with idle state", () => {
      expect(agent.getState()).toBe(AgentState.IDLE);
    });

    test("should store configuration", () => {
      const config = agent.getConfig();
      expect(config.model).toBe("claude-3-5-sonnet-20241022");
      expect(config.tools).toHaveLength(2);
    });
  });

  describe("message history", () => {
    test("should start with empty message history", () => {
      const messages = agent.getMessages();
      expect(messages).toHaveLength(0);
    });

    test("should add user message", () => {
      agent.addUserMessage("Hello");
      const messages = agent.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe("user");
      expect(messages[0].content).toBe("Hello");
    });
  });

  describe("state management", () => {
    test("should transition to streaming when processing", () => {
      agent.addUserMessage("Test");
      expect(agent.getState()).toBe(AgentState.IDLE);
    });

    test("should provide state transition method", () => {
      const transitioned = agent.transition("user_message");
      expect(transitioned).toBe(true);
      expect(agent.getState()).toBe(AgentState.STREAMING);
    });
  });

  describe("tool execution", () => {
    test("should identify safe tools", () => {
      const isSafe = agent.isToolSafe("mock_safe_tool");
      expect(isSafe).toBe(true);
    });

    test("should identify dangerous tools", () => {
      const isSafe = agent.isToolSafe("mock_dangerous_tool");
      expect(isSafe).toBe(false);
    });

    test("should execute safe tool immediately", async () => {
      const result = await agent.executeTool("mock_safe_tool", {
        input: "test",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain("Safe result");
      }
    });

    test("should not execute dangerous tool without confirmation", async () => {
      agent.transition("user_message");
      agent.transition("streaming_complete");
      
      const needsConfirmation = !agent.isToolSafe("mock_dangerous_tool");
      expect(needsConfirmation).toBe(true);
    });
  });

  describe("confirmation flow", () => {
    test("should expose pending confirmation details", () => {
      agent.setPendingToolCall("mock_dangerous_tool", { command: "rm -rf /" });
      const pending = agent.getPendingToolCall();
      
      expect(pending).toBeDefined();
      if (pending) {
        expect(pending.toolName).toBe("mock_dangerous_tool");
        expect(pending.input).toEqual({ command: "rm -rf /" });
      }
    });

    test("should clear pending confirmation after approval", async () => {
      agent.setPendingToolCall("mock_dangerous_tool", { command: "ls" });
      agent.confirmToolExecution();
      
      const pending = agent.getPendingToolCall();
      expect(pending).toBeNull();
    });

    test("should clear pending confirmation after rejection", () => {
      agent.setPendingToolCall("mock_dangerous_tool", { command: "ls" });
      agent.rejectToolExecution();
      
      const pending = agent.getPendingToolCall();
      expect(pending).toBeNull();
    });
  });

  describe("error handling", () => {
    test("should handle tool execution errors", async () => {
      const errorAgent = new Agent({
        apiKey: mockApiKey,
        model: "claude-3-5-sonnet-20241022",
        tools: [mockSafeTool],
        toolExecutors: {
          mock_safe_tool: async () => ({
            success: false,
            error: "Tool failed",
          }),
        },
      });

      const result = await errorAgent.executeTool("mock_safe_tool", {
        input: "test",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Tool failed");
      }
    });

    test("should handle unknown tool gracefully", async () => {
      const result = await agent.executeTool("unknown_tool", {});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Unknown tool");
      }
    });
  });

  describe("reset", () => {
    test("should clear messages on reset", () => {
      agent.addUserMessage("Test 1");
      agent.addUserMessage("Test 2");
      expect(agent.getMessages()).toHaveLength(2);
      
      agent.reset();
      expect(agent.getMessages()).toHaveLength(0);
    });

    test("should return to idle state on reset", () => {
      agent.transition("user_message");
      expect(agent.getState()).toBe(AgentState.STREAMING);
      
      agent.reset();
      expect(agent.getState()).toBe(AgentState.IDLE);
    });
  });
});
