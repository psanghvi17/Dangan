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

    # Email Settings
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "Dangan"
    
    # Alternative email settings (to match your .env file)
    smtp_user: str = ""
    smtp_pass: str = ""
    smtp_sender_name: str = "Dangan"
    smtp_sender_email: str = ""
    
    # Frontend URL for password reset links
    frontend_url: str = "http://localhost:3000"

    # pydantic-settings v2 configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()