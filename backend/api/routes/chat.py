from __future__ import annotations

"""SSE streaming chat endpoint."""

import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from api.deps import get_current_user
from db import queries
from engine.orchestrator import stream_response

router = APIRouter()


class ChatMessage(BaseModel):
    content: str


@router.post("/{session_id}/message")
async def send_message(
    session_id: str,
    msg: ChatMessage,
    user: dict = Depends(get_current_user),
):
    session = queries.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if session["status"] not in ("active",):
        raise HTTPException(status_code=400, detail="Session is not active")

    async def event_generator():
        # Send an immediate SSE comment to flush proxy buffers and keep the
        # connection alive while the AI model generates its first token.
        yield ": stream-open\n\n"

        # Run the orchestrator response in a task so we can send keepalive
        # comments during long pauses (Render proxies may timeout otherwise).
        queue: asyncio.Queue[str | None] = asyncio.Queue()

        async def _produce():
            try:
                async for event in stream_response(session, msg.content):
                    await queue.put(event)
            except Exception as exc:
                await queue.put(f"event: error\ndata: {json.dumps({'message': str(exc)})}\n\n")
            finally:
                await queue.put(None)  # sentinel

        task = asyncio.create_task(_produce())

        while True:
            try:
                item = await asyncio.wait_for(queue.get(), timeout=15)
            except asyncio.TimeoutError:
                # No data for 15s — send keepalive to prevent proxy timeout
                yield ": keepalive\n\n"
                continue

            if item is None:
                break
            yield item

        await task  # propagate any unhandled exceptions

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
