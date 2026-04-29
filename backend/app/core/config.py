from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost/dailydifint"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    FIREBASE_CREDENTIALS_PATH: str = ""
    ADMIN_USERNAMES: str = "wonlee,admin2"  # comma-separated, e.g. "wonlee,admin2"

    class Config:
        env_file = ".env"

settings = Settings()
