"use client";

import { useCallback, useState } from "react";
import type { AgentEvent, ChatMessage } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

interface StreamState {
  messages: ChatMessage[];
  logs: AgentEvent[];
  isRunning: boolean;
  error: string | null;
  send: (text: string) => Promise<void>;
}

export function useAgentStream(sessionId: string): StreamState {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [logs, setLogs] = useState<AgentEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isRunning) return;

      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      setLogs([]);
      setError(null);
      setIsRunning(true);

      let answered = false;

      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, session_id: sessionId }),
        });
        if (!res.ok || !res.body) {
          throw new Error(`Server responded ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            const dataLine = frame
              .split("\n")
              .find((line) => line.startsWith("data:"));
            if (!dataLine) continue;

            const event = JSON.parse(dataLine.slice(5).trim()) as AgentEvent;
            setLogs((prev) => [...prev, event]);

            if (event.type === "final_answer") {
              answered = true;
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: String(event.payload.text ?? "") },
              ]);
            } else if (event.type === "error") {
              setError(String(event.payload.message ?? "Unknown error"));
            }
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!answered) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "(no answer — the run ended early; see the log)",
            },
          ]);
        }
        setIsRunning(false);
      }
    },
    [isRunning, sessionId],
  );

  return { messages, logs, isRunning, error, send };
}
