from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "ZenSutra"
    DEBUG: bool = False

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # Database
    DATABASE_URL: str = "sqlite:///./zensutra.db"

    # JWT
    SECRET_KEY: str = "change-this-secret-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Model
    MOOD_MODEL_PATH: str = "MoodModel/model_file_30epochs.h5"
    MOOD_LABELS: List[str] = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]

    class Config:
        env_file = ".env"


settings = Settings()