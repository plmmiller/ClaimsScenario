from __future__ import annotations

import os
from pathlib import Path
from dotenv import dotenv_values
from pydantic_settings import BaseSettings

# Load .env values and inject into os.environ so they override empty shell vars
_env_path = Path(__file__).resolve().parent / ".env"
if _env_path.exists():
    for key, value in dotenv_values(_env_path).items():
        if value and not os.environ.get(key):
            os.environ[key] = value


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""
    frontend_url: str = "http://localhost:3000"
    environment: str = "development"
    ai_model: str = "claude-sonnet-4-20250514"
    ai_max_tokens: int = 4096

    class Config:
        env_file = str(_env_path)


settings = Settings()
