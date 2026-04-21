from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/values_collection"
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    upload_dir: str = "./uploads"
    mail_from: str = "noreply@values-collection.local"
    mail_server: str = "localhost"
    mail_port: int = 1025
    mail_dev_console: bool = True
    frontend_url: str = "http://localhost:4200"


settings = Settings()
