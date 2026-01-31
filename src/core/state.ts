export enum AgentState {
  IDLE = "idle",
  STREAMING = "streaming",
  AWAITING_CONFIRMATION = "awaiting_confirmation",
  TOOL_EXECUTING = "tool_executing",
  ERROR = "error",
}

export type StateEvent =
  | "user_message"
  | "dangerous_tool_detected"
  | "safe_tool_detected"
  | "streaming_complete"
  | "user_confirmed"
  | "user_rejected"
  | "tool_completed"
  | "error_occurred"
  | "reset";

type StateTransitionMap = {
  [K in AgentState]: Partial<Record<StateEvent, AgentState>>;
};

const TRANSITIONS: StateTransitionMap = {
  [AgentState.IDLE]: {
    user_message: AgentState.STREAMING,
    error_occurred: AgentState.ERROR,
  },
  [AgentState.STREAMING]: {
    dangerous_tool_detected: AgentState.AWAITING_CONFIRMATION,
    safe_tool_detected: AgentState.TOOL_EXECUTING,
    streaming_complete: AgentState.IDLE,
    error_occurred: AgentState.ERROR,
  },
  [AgentState.AWAITING_CONFIRMATION]: {
    user_confirmed: AgentState.TOOL_EXECUTING,
    user_rejected: AgentState.IDLE,
    error_occurred: AgentState.ERROR,
  },
  [AgentState.TOOL_EXECUTING]: {
    tool_completed: AgentState.STREAMING,
    error_occurred: AgentState.ERROR,
  },
  [AgentState.ERROR]: {
    reset: AgentState.IDLE,
  },
};

export class AgentStateMachine {
  private currentState: AgentState;

  constructor() {
    this.currentState = AgentState.IDLE;
  }

  getCurrentState(): AgentState {
    return this.currentState;
  }

  transition(event: StateEvent): boolean {
    const nextState = TRANSITIONS[this.currentState][event];

    if (nextState === undefined) {
      return false;
    }

    this.currentState = nextState;
    return true;
  }

  reset(): void {
    this.currentState = AgentState.IDLE;
  }
}
