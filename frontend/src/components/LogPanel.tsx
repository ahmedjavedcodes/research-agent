"use client";

import { useEffect, useRef } from "react";
import type { AgentEvent } from "@/lib/types";
import { LogLine } from "./LogLine";

export function LogPanel({
  logs,
  isRunning,
}: {
  logs: AgentEvent[];
  isRunning: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <section className="flex h-full flex-col bg-slate-950">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Execution log
        </h2>
        <span
          className={`text-xs ${isRunning ? "text-emerald-400" : "text-slate-600"}`}
        >
          {isRunning ? "● running" : "idle"}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs">
        {logs.length === 0 ? (
          <p className="text-slate-600">
            The Thought / Action / Observation stream will appear here.
          </p>
        ) : (
          logs.map((event, i) => <LogLine key={i} event={event} />)
        )}
        <div ref={endRef} />
      </div>
    </section>
  );
}
