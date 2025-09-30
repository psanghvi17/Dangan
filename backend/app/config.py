from pydantic_settings import BaseSettings
from urllib.parse import quote

class Settings(BaseSettings):
    # Database URL - must be provided in .env file
    database_url: str
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    class Config:
        env_file = ".env"

settings = Settings()