// Mirror of agent/events.py

export type EventType =
  | "run_start"
  | "thought"
  | "action"
  | "tool_input"
  | "observation"
  | "tool_latency"
  | "summary_updated"
  | "final_answer"
  | "error"
  | "run_end";

export interface AgentEvent {
  type: EventType;
  timestamp: string;
  iteration: number;
  session_id: string;
  payload: Record<string, unknown>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
