from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database URL (default can be overridden via .env)
    database_url: str = (
        "postgresql+psycopg://pankhu:23%40Paras@64.227.158.128:5432/Dangan"
    )

    # JWT Settings
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # pydantic-settings v2 configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()