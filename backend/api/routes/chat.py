from __future__ import annotations

"""SSE streaming chat endpoint."""

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
        async for event in stream_response(session, msg.content):
            yield event

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
