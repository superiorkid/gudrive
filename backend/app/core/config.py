from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    upload_tmp_dir: str
    upload_final_dir: str
    upload_thumbnail_dir: str
    upload_chunk_size: int = 5 * 1024 * 1024  # 5mb
    redis_url: str
    app_env: str
    access_token_key: str

    @property
    def celery_broker_url(self) -> str:
        return self.redis_url

    @property
    def celery_result_url(self):
        return self.redis_url

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_configs() -> Settings:
    return Settings()  # ty:ignore[missing-argument]
