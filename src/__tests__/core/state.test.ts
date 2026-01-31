import { test, expect, describe } from "bun:test";
import { AgentStateMachine, AgentState } from "../../core/state";

describe("AgentStateMachine", () => {
  describe("Initial State", () => {
    test("should start in idle state", () => {
      const stateMachine = new AgentStateMachine();
      expect(stateMachine.getCurrentState()).toBe(AgentState.IDLE);
    });
  });

  describe("Valid State Transitions", () => {
    test("idle → streaming (user sends message)", () => {
      const sm = new AgentStateMachine();
      expect(sm.transition("user_message")).toBe(true);
      expect(sm.getCurrentState()).toBe(AgentState.STREAMING);
    });

    test("streaming → awaiting_confirmation (dangerous tool detected)", () => {
      const sm = new AgentStateMachine();
      sm.transition("user_message"); // idle → streaming
      expect(sm.transition("dangerous_tool_detected")).toBe(true);
      expect(sm.getCurrentState()).toBe(AgentState.AWAITING_CONFIRMATION);
    });

    test("streaming → tool_executing (safe tool detected)", () => {
      const sm = new AgentStateMachine();
      sm.transition("user_message"); // idle → streaming
      expect(sm.transition("safe_tool_detected")).toBe(true);
      expect(sm.getCurrentState()).toBe(AgentState.TOOL_EXECUTING);
    });

    test("streaming → idle (streaming complete, no tools)", () => {
      const sm = new AgentStateMachine();
      sm.transition("user_message"); // idle → streaming
      expect(sm.transition("streaming_complete")).toBe(true);
      expect(sm.getCurrentState()).toBe(AgentState.IDLE);
    });

    test("awaiting_confirmation → tool_executing (user confirms)", () => {
      const sm = new AgentStateMachine();
      sm.transition("user_message"); // idle → streaming
      sm.transition("dangerous_tool_detected"); // streaming → awaiting_confirmation
      expect(sm.transition("user_confirmed")).toBe(true);
      expect(sm.getCurrentState()).toBe(AgentState.TOOL_EXECUTING);
    });

    test("awaiting_confirmation → idle (user rejects)", () => {
      const sm = new AgentStateMachine();
      sm.transition("user_message"); // idle → streaming
      sm.transition("dangerous_tool_detected"); // streaming → awaiting_confirmation
      expect(sm.transition("user_rejected")).toBe(true);
      expect(sm.getCurrentState()).toBe(AgentState.IDLE);
    });

    test("tool_executing → streaming (tool result sent to Claude)", () => {
      const sm = new AgentStateMachine();
      sm.transition("user_message"); // idle → streaming
      sm.transition("safe_tool_detected"); // streaming → tool_executing
      expect(sm.transition("tool_completed")).toBe(true);
      expect(sm.getCurrentState()).toBe(AgentState.STREAMING);
    });

    test("any state → error (error occurs)", () => {
      const sm = new AgentStateMachine();
      expect(sm.transition("error_occurred")).toBe(true);
      expect(sm.getCurrentState()).toBe(AgentState.ERROR);

      const sm2 = new AgentStateMachine();
      sm2.transition("user_message"); // idle → streaming
      expect(sm2.transition("error_occurred")).toBe(true);
      expect(sm2.getCurrentState()).toBe(AgentState.ERROR);
    });

    test("error → idle (recovery)", () => {
      const sm = new AgentStateMachine();
      sm.transition("error_occurred"); // any → error
      expect(sm.transition("reset")).toBe(true);
      expect(sm.getCurrentState()).toBe(AgentState.IDLE);
    });
  });

  describe("Invalid State Transitions", () => {
    test("idle → awaiting_confirmation (invalid)", () => {
      const sm = new AgentStateMachine();
      expect(sm.transition("dangerous_tool_detected")).toBe(false);
      expect(sm.getCurrentState()).toBe(AgentState.IDLE); // should remain in idle
    });

    test("idle → tool_executing (invalid)", () => {
      const sm = new AgentStateMachine();
      expect(sm.transition("safe_tool_detected")).toBe(false);
      expect(sm.getCurrentState()).toBe(AgentState.IDLE);
    });

    test("awaiting_confirmation → streaming (invalid)", () => {
      const sm = new AgentStateMachine();
      sm.transition("user_message"); // idle → streaming
      sm.transition("dangerous_tool_detected"); // streaming → awaiting_confirmation
      expect(sm.transition("user_message")).toBe(false);
      expect(sm.getCurrentState()).toBe(AgentState.AWAITING_CONFIRMATION);
    });

    test("tool_executing → idle (invalid direct transition)", () => {
      const sm = new AgentStateMachine();
      sm.transition("user_message"); // idle → streaming
      sm.transition("safe_tool_detected"); // streaming → tool_executing
      expect(sm.transition("streaming_complete")).toBe(false);
      expect(sm.getCurrentState()).toBe(AgentState.TOOL_EXECUTING);
    });

    test("unknown event returns false", () => {
      const sm = new AgentStateMachine();
      expect(sm.transition("unknown_event" as any)).toBe(false);
      expect(sm.getCurrentState()).toBe(AgentState.IDLE);
    });
  });

  describe("State Getter", () => {
    test("getCurrentState returns current state", () => {
      const sm = new AgentStateMachine();
      expect(sm.getCurrentState()).toBe(AgentState.IDLE);
      
      sm.transition("user_message");
      expect(sm.getCurrentState()).toBe(AgentState.STREAMING);
      
      sm.transition("dangerous_tool_detected");
      expect(sm.getCurrentState()).toBe(AgentState.AWAITING_CONFIRMATION);
    });
  });

  describe("State Type/Enum", () => {
    test("AgentState enum contains all 5 states", () => {
      expect(AgentState.IDLE).toBeDefined();
      expect(AgentState.STREAMING).toBeDefined();
      expect(AgentState.AWAITING_CONFIRMATION).toBeDefined();
      expect(AgentState.TOOL_EXECUTING).toBeDefined();
      expect(AgentState.ERROR).toBeDefined();
    });
  });

  describe("Complex State Flows", () => {
    test("full successful tool execution flow", () => {
      const sm = new AgentStateMachine();
      
      // User sends message
      sm.transition("user_message");
      expect(sm.getCurrentState()).toBe(AgentState.STREAMING);
      
      // Claude detects safe tool
      sm.transition("safe_tool_detected");
      expect(sm.getCurrentState()).toBe(AgentState.TOOL_EXECUTING);
      
      // Tool completes, result sent back to Claude
      sm.transition("tool_completed");
      expect(sm.getCurrentState()).toBe(AgentState.STREAMING);
      
      // Claude finishes response
      sm.transition("streaming_complete");
      expect(sm.getCurrentState()).toBe(AgentState.IDLE);
    });

    test("dangerous tool confirmation flow", () => {
      const sm = new AgentStateMachine();
      
      // User sends message
      sm.transition("user_message");
      expect(sm.getCurrentState()).toBe(AgentState.STREAMING);
      
      // Claude detects dangerous tool
      sm.transition("dangerous_tool_detected");
      expect(sm.getCurrentState()).toBe(AgentState.AWAITING_CONFIRMATION);
      
      // User confirms
      sm.transition("user_confirmed");
      expect(sm.getCurrentState()).toBe(AgentState.TOOL_EXECUTING);
      
      // Tool completes
      sm.transition("tool_completed");
      expect(sm.getCurrentState()).toBe(AgentState.STREAMING);
      
      // Claude finishes
      sm.transition("streaming_complete");
      expect(sm.getCurrentState()).toBe(AgentState.IDLE);
    });

    test("dangerous tool rejection flow", () => {
      const sm = new AgentStateMachine();
      
      // User sends message
      sm.transition("user_message");
      expect(sm.getCurrentState()).toBe(AgentState.STREAMING);
      
      // Claude detects dangerous tool
      sm.transition("dangerous_tool_detected");
      expect(sm.getCurrentState()).toBe(AgentState.AWAITING_CONFIRMATION);
      
      // User rejects
      sm.transition("user_rejected");
      expect(sm.getCurrentState()).toBe(AgentState.IDLE);
    });

    test("error recovery flow", () => {
      const sm = new AgentStateMachine();
      
      // User sends message
      sm.transition("user_message");
      expect(sm.getCurrentState()).toBe(AgentState.STREAMING);
      
      // Error occurs
      sm.transition("error_occurred");
      expect(sm.getCurrentState()).toBe(AgentState.ERROR);
      
      // Recover
      sm.transition("reset");
      expect(sm.getCurrentState()).toBe(AgentState.IDLE);
    });
  });
});
