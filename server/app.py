"""FastAPI app exposing the research agent over a Server-Sent-Events stream."""

from __future__ import annotations

import asyncio
from functools import partial

import anyio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agent.config import FRONTEND_ORIGIN
from agent.llm import GroqLLM
from agent.logging_hooks import ExecutionLogger
from agent.memory import HybridMemory
from agent.react_loop import ReActAgent

app = FastAPI(title="Research Agent API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_llm = GroqLLM()
_logger = ExecutionLogger(to_console=True, to_file=True)
_sessions: dict[str, HybridMemory] = {}
_sessions_lock = asyncio.Lock()


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"


async def _memory_for(session_id: str) -> HybridMemory:
    async with _sessions_lock:
        mem = _sessions.get(session_id)
        if mem is None:
            mem = HybridMemory(_llm, logger=_logger)
            _sessions[session_id] = mem
        return mem


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat")
async def chat(req: ChatRequest) -> StreamingResponse:
    memory = await _memory_for(req.session_id)
    agent = ReActAgent(llm=_llm, memory=memory, logger=_logger)
    loop = asyncio.get_running_loop()
    queue: asyncio.Queue = asyncio.Queue()
    _logger.subscribe(queue, loop)

    async def run_agent() -> None:
        await anyio.to_thread.run_sync(
            partial(agent.run, req.message, session_id=req.session_id)
        )

    task = asyncio.create_task(run_agent())

    def _on_done(t: asyncio.Task) -> None:
        if t.cancelled():
            return
        exc = t.exception()
        if exc is not None:
            _logger.event("error", session_id=req.session_id, message=repr(exc))
            _logger.event(
                "final_answer",
                session_id=req.session_id,
                text="The agent hit an internal error and could not finish this request.",
            )
            _logger.event("run_end", session_id=req.session_id, iterations=0)

    task.add_done_callback(_on_done)

    async def event_stream():
        try:
            while True:
                event = await queue.get()
                if event.session_id != req.session_id:
                    continue
                yield event.sse()
                if event.type == "run_end":
                    break
        finally:
            _logger.unsubscribe(queue)
            if not task.done():
                task.cancel()

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
