from __future__ import annotations

"""ElevenLabs audio endpoints: transcribe (STT) and speak (TTS)."""

import logging
import traceback
from io import BytesIO

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from api.deps import get_current_user
from config import settings
from engine import scenario_loader

logger = logging.getLogger(__name__)

router = APIRouter()


# Default ElevenLabs voice IDs from the public voice library.
# Personas are mapped by id — unknown personas fall back to DEFAULT_VOICE_ID.
# Voice IDs reference the multilingual v2 library; curated for persona fit.
PERSONA_VOICE_MAP: dict[str, str] = {
    # Claims scenario
    "sarah-mitchell": "EXAVITQu4vr4xnSDxMaL",   # Sarah — calm female
    "james-torres": "TxGEqnHWrfWFTfGW9XjX",      # Josh — assertive male
    "linda-park": "XrExE9yKIg1WjnnlVkGX",        # Matilda — clear female
    "mikes-auto-body": "VR6AewLTigWG4xSOukaG",   # Arnold — gruff male
    "dr-patel": "pNInz6obpgDQGcFmaJgB",          # Adam — professional male
    "attorney-davis": "onwK4e9ZLuTAKqWW03F9",    # Daniel — authoritative male
    # Commercial property underwriting
    "karen-wells": "ThT5KcBeYPX3keUQqHPh",       # Dorothy — warm female
    "david-chen": "N2lVS1w4EtoT3dr4eOWO",        # Callum — business male
    "maria-santos": "jBpfuIE2acCO8z3wKNLl",      # Gigi — friendly female
    "tom-bradshaw": "CYw3kZ02Hs0563khs1Fj",      # Dave — senior male
    # Marketing / SmartDrive launch
    "lisa-morgan": "LcfcDJNUP1GQjkzn1xUU",       # Emily — executive female
    "raj-patel": "IKne3meq5aSn9XLyUdCD",         # Charlie — male
    "emma-wright": "21m00Tcm4TlvDq8ikWAM",       # Rachel — young female
    "carlos-mendez": "bVMeCyTHy58xNoL34h3p",     # Jeremy — analytical male
    "jennifer-kim": "piTKgcLEGmPE4e6mEKli",      # Nicole — female consumer
}

DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Rachel — neutral fallback


def _get_client():
    """Lazy-load ElevenLabs client so import doesn't fail when key missing."""
    if not settings.elevenlabs_api_key:
        raise HTTPException(status_code=503, detail="ElevenLabs API key not configured")
    from elevenlabs.client import ElevenLabs
    return ElevenLabs(api_key=settings.elevenlabs_api_key)


class SpeakRequest(BaseModel):
    text: str
    persona_id: str | None = None


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    """Convert an uploaded audio file to text using ElevenLabs Scribe."""
    client = _get_client()
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file")

    # Wrap bytes in a named BytesIO — ElevenLabs SDK uses file.name to
    # determine the content type for the multipart upload.
    audio_io = BytesIO(audio_bytes)
    audio_io.name = file.filename or "recording.webm"

    try:
        result = client.speech_to_text.convert(
            file=audio_io,
            model_id="scribe_v1",
        )
        text = getattr(result, "text", None) or ""
        return {"text": text.strip()}
    except Exception as exc:
        logger.error("Transcription failed: %s\n%s", exc, traceback.format_exc())
        raise HTTPException(status_code=502, detail=f"Transcription failed: {exc}") from exc


@router.post("/speak")
async def speak_text(
    req: SpeakRequest,
    user: dict = Depends(get_current_user),
):
    """Convert text to speech using ElevenLabs. Returns audio/mpeg stream."""
    client = _get_client()

    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Empty text")

    voice_id = PERSONA_VOICE_MAP.get(req.persona_id or "", DEFAULT_VOICE_ID)

    try:
        audio_iter = client.text_to_speech.convert(
            voice_id=voice_id,
            text=req.text,
            model_id="eleven_turbo_v2_5",
            output_format="mp3_44100_128",
        )

        def generate():
            for chunk in audio_iter:
                if chunk:
                    yield chunk

        return StreamingResponse(
            generate(),
            media_type="audio/mpeg",
            headers={"Cache-Control": "no-cache"},
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"TTS failed: {exc}") from exc
