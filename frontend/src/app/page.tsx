"use client";

import { useEffect, useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { LogPanel } from "@/components/LogPanel";
import { useAgentStream } from "@/lib/useAgentStream";

export default function Home() {
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  const { messages, logs, isRunning, error, send } = useAgentStream(
    sessionId || "pending",
  );

  return (
    <main className="grid h-screen grid-cols-1 md:grid-cols-2">
      <ChatPanel
        messages={messages}
        isRunning={isRunning}
        error={error}
        onSend={send}
      />
      <LogPanel logs={logs} isRunning={isRunning} />
    </main>
  );
}
