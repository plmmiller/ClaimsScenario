from __future__ import annotations

import httpx
from fastapi import Request, HTTPException
from jose import jwt, JWTError, jwk
from jose.utils import base64url_decode

from config import settings

# Cache the JWKS keys
_jwks_cache: dict | None = None


async def _get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    async with httpx.AsyncClient() as client:
        resp = await client.get(jwks_url)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        return _jwks_cache


def _find_key(jwks: dict, kid: str) -> dict | None:
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key
    return None


async def verify_supabase_token(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token")

    token = auth_header.split(" ", 1)[1]
    try:
        # Decode header to get kid and alg
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")

        if alg == "ES256":
            # Use JWKS-based verification
            jwks = await _get_jwks()
            kid = header.get("kid")
            key_data = _find_key(jwks, kid)
            if not key_data:
                raise JWTError(f"No matching key found for kid={kid}")

            public_key = jwk.construct(key_data, algorithm="ES256")
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["ES256"],
                audience="authenticated",
            )
        else:
            # Fallback to legacy HS256 with JWT secret
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
