"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";

export function ChatPanel({
  messages,
  isRunning,
  error,
  onSend,
}: {
  messages: ChatMessage[];
  isRunning: boolean;
  error: string | null;
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isRunning]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || isRunning) return;
    onSend(draft);
    setDraft("");
  };

  return (
    <section className="flex h-full flex-col border-r border-slate-800 bg-slate-900">
      <header className="border-b border-slate-800 px-4 py-3">
        <h1 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
          Research Agent
        </h1>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="text-sm text-slate-500">
            Ask a multi-hop question — the agent will search the web, read local
            files, and stream its reasoning to the log on the right.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                m.role === "user"
                  ? "bg-sky-600 text-white"
                  : "bg-slate-800 text-slate-100"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isRunning && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-slate-800 px-4 py-2 text-sm text-slate-400">
              thinking…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <p className="border-t border-rose-900 bg-rose-950/50 px-4 py-2 text-xs text-rose-300">
          {error}
        </p>
      )}

      <form onSubmit={submit} className="border-t border-slate-800 p-3">
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask a question…"
            disabled={isRunning}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isRunning || !draft.trim()}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </section>
  );
}
