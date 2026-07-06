"""Application configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Analytics service configuration."""

    # Server
    PORT: int = 8000
    DEBUG: bool = True
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Database (read from Next.js shared DB)
    DATABASE_URL: str = ""
    
    # Google AI Studio
    GOOGLE_AI_API_KEY: str = ""
    
    # Market Data
    GROWW_API_KEY: str = ""
    GROWW_API_SECRET: str = ""
    
    # SEBI Compliance / Network
    STATIC_IP_PROXY: str = ""

    model_config = SettingsConfigDict(
        env_file="../../.env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
