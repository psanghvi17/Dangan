from pydantic_settings import BaseSettings
from urllib.parse import quote

class Settings(BaseSettings):
    # URL encode the password to handle special characters
    database_url: str = "postgresql+psycopg://pankhu:23%40Paras@64.227.158.128:5432/Dangan"
    class Config:
        env_file = ".env"

settings = Settings()