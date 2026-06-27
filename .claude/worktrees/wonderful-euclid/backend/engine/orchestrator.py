from __future__ import annotations

"""Core AI conversation loop with streaming and tool use."""

import json
from typing import AsyncGenerator

import anthropic

from config import settings
from engine.prompt_builder import build_system_prompt
from engine.tools import TOOLS
from engine.tool_handlers import ToolHandlers
from engine.coaching import get_phase_intro_coaching
from engine.phase_manager import is_coaching_allowed
from engine import scenario_loader
from db import queries


async def stream_response(session: dict, user_message: str) -> AsyncGenerator[str, None]:
    """Process a user message and stream the AI response as SSE events."""
    scenario = scenario_loader.get_scenario(session["scenario_id"])
    if not scenario:
        yield _sse("error", {"message": "Scenario not found"})
        return

    # Build system prompt
    system_prompt = build_system_prompt(session, scenario)

    # Load conversation history
    history = queries.get_messages(session["id"], limit=50)
    api_messages = _build_api_messages(history)

    # Add the new user message
    api_messages.append({"role": "user", "content": user_message})

    # Save user message to DB
    queries.save_message(
        session_id=session["id"],
        role="user",
        content=user_message,
        phase=session["current_phase"],
    )

    # Check if this is the first message — provide phase intro coaching
    if len(history) == 0 and is_coaching_allowed(session["mode"], session["current_phase"]):
        intro = get_phase_intro_coaching(session["current_phase"], session["difficulty"])
        if intro:
            yield _sse("coaching", {"type": "phase_guidance", "hint": intro})

    # Initialize tool handlers
    handler = ToolHandlers(session, scenario)

    # Run the conversation loop
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    full_response_text = ""
    current_persona = None

    try:
        async for event in _run_conversation_loop(
            client, system_prompt, api_messages, handler
        ):
            if event["type"] == "text":
                full_response_text += event["data"]
                yield _sse("token", {"text": event["data"]})
            elif event["type"] == "tool_use":
                # Tool calls generate their own SSE events via handler
                for sse_event in handler.sse_events:
                    yield _sse(sse_event["event"], sse_event["data"])
                handler.sse_events.clear()

                # Track persona for message saving
                if event.get("tool_name") == "set_active_persona":
                    current_persona = event.get("tool_input", {}).get("persona_id")

        # Persist state changes
        handler.persist_state()

        # Save assistant response
        if full_response_text.strip():
            queries.save_message(
                session_id=session["id"],
                role="assistant",
                content=full_response_text,
                phase=session.get("current_phase", session["current_phase"]),
                persona=current_persona,
            )

        yield _sse("done", {})

    except anthropic.APIError as e:
        yield _sse("error", {"message": f"AI API error: {str(e)}"})
    except Exception as e:
        yield _sse("error", {"message": f"Unexpected error: {str(e)}"})


async def _run_conversation_loop(
    client: anthropic.AsyncAnthropic,
    system_prompt: str,
    messages: list[dict],
    handler: ToolHandlers,
) -> AsyncGenerator[dict, None]:
    """Run the Anthropic API conversation loop with tool use, yielding events."""
    max_turns = 10  # Safety limit on tool-use turns

    for _ in range(max_turns):
        # Stream the response
        collected_content = []
        stop_reason = None

        async with client.messages.stream(
            model=settings.ai_model,
            max_tokens=settings.ai_max_tokens,
            system=system_prompt,
            messages=messages,
            tools=TOOLS,
        ) as stream:
            current_text = ""

            async for event in stream:
                if event.type == "content_block_start":
                    if event.content_block.type == "text":
                        current_text = ""
                    elif event.content_block.type == "tool_use":
                        pass  # Will be handled on completion

                elif event.type == "content_block_delta":
                    if event.delta.type == "text_delta":
                        current_text += event.delta.text
                        yield {"type": "text", "data": event.delta.text}

                elif event.type == "message_delta":
                    stop_reason = event.delta.stop_reason

            # Get the full response
            response = await stream.get_final_message()
            collected_content = response.content

        # Process tool calls
        tool_results = []
        has_tool_use = False

        for block in collected_content:
            if block.type == "tool_use":
                has_tool_use = True
                result = handler.handle(block.name, block.input)

                yield {
                    "type": "tool_use",
                    "tool_name": block.name,
                    "tool_input": block.input,
                    "result": result,
                }

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(result),
                })

        # If there were tool calls, continue the loop
        if has_tool_use:
            # Add assistant message with all content blocks
            messages.append({"role": "assistant", "content": collected_content})
            # Add all tool results
            messages.append({"role": "user", "content": tool_results})
        else:
            # No tool calls — we're done
            break


def _build_api_messages(history: list[dict]) -> list[dict]:
    """Convert stored messages to Anthropic API format."""
    api_messages = []

    for msg in history:
        role = msg["role"]
        content = msg["content"]

        if role == "user":
            api_messages.append({"role": "user", "content": content})
        elif role == "assistant":
            api_messages.append({"role": "assistant", "content": content})
        # tool_call and tool_result messages are embedded in the
        # assistant/user turns via the content blocks, so we skip
        # standalone tool messages in the simple reconstruction

    return api_messages


def _sse(event: str, data: dict) -> str:
    """Format a server-sent event."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"
