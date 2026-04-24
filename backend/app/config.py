from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    DATABASE_URL: str = "postgresql+asyncpg://agregador:password@localhost/agregador_pesquisas"
    DATABASE_URL_SYNC: str = "postgresql://agregador:password@localhost/agregador_pesquisas"
    SECRET_KEY: str = "change-me-in-production"
    ADMIN_API_KEY: str = "change-me-admin-key"
    SCRAPER_API_KEY: str = "change-me-scraper-key"
    CORS_ORIGINS: str = "http://localhost:3000"
    SCRAPER_INTERVAL_HOURS: int = 24
    AGGREGATION_LAMBDA: float = 0.02  # recency decay: ~35-day half-life
    APP_VERSION: str = "1.0.0"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]


settings = Settings()
