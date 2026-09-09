import type { AgentEvent, EventType } from "@/lib/types";

const STYLE: Record<EventType, { label: string; className: string }> = {
  run_start: { label: "START", className: "text-slate-300" },
  thought: { label: "THOUGHT", className: "text-cyan-300" },
  action: { label: "ACTION", className: "text-amber-300 font-semibold" },
  tool_input: { label: "INPUT", className: "text-amber-200" },
  observation: { label: "OBSERVATION", className: "text-emerald-300" },
  tool_latency: { label: "LATENCY", className: "text-fuchsia-300" },
  summary_updated: { label: "MEMORY", className: "text-blue-300" },
  final_answer: { label: "ANSWER", className: "text-slate-50 font-semibold" },
  error: { label: "ERROR", className: "text-rose-400 font-semibold" },
  run_end: { label: "END", className: "text-slate-500" },
};

const s = (v: unknown): string => (v === undefined || v === null ? "" : String(v));

function render(event: AgentEvent): string {
  const p = event.payload;
  switch (event.type) {
    case "run_start":
      return `Question: ${s(p.question)}`;
    case "thought":
      return s(p.text);
    case "action":
      return s(p.tool);
    case "tool_input":
      return typeof p.input === "string" ? p.input : JSON.stringify(p.input);
    case "observation":
      return s(p.text);
    case "tool_latency":
      return `${s(p.tool)} — ${s(p.ms)} ms`;
    case "summary_updated":
      return `rolling summary updated (${s(p.chars)} chars)`;
    case "final_answer":
      return s(p.text);
    case "error":
      return s(p.message);
    case "run_end":
      return `finished in ${s(p.iterations)} iteration(s)`;
    default:
      return JSON.stringify(p);
  }
}

function stamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--:--";
  return d.toLocaleTimeString("en-GB", { hour12: false });
}

export function LogLine({ event }: { event: AgentEvent }) {
  const style = STYLE[event.type] ?? STYLE.run_end;
  return (
    <div className="flex gap-2 py-0.5 leading-relaxed">
      <span className="shrink-0 text-slate-600">{stamp(event.timestamp)}</span>
      <span className={`shrink-0 w-24 ${style.className}`}>{style.label}</span>
      <span className={`whitespace-pre-wrap break-words ${style.className}`}>
        {render(event)}
      </span>
    </div>
  );
}
