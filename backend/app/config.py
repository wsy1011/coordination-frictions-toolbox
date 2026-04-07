from __future__ import annotations

from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE_PROJECT_DIR = ROOT_DIR.parent / "coordination frictions"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ROOT_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_mode: str = Field(default="demo", alias="APP_MODE")
    source_project_dir: Path = Field(
        default=DEFAULT_SOURCE_PROJECT_DIR,
        alias="SOURCE_PROJECT_DIR",
    )
    private_data_dir: Path | None = Field(default=None, alias="PRIVATE_DATA_DIR")
    map_tile_url: str = Field(
        default="https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        alias="MAP_TILE_URL",
    )
    min_disclosure_threshold: int = Field(
        default=10,
        alias="MIN_DISCLOSURE_THRESHOLD",
    )

    @field_validator("private_data_dir", mode="before")
    @classmethod
    def normalize_optional_path(cls, value: object) -> object:
        if value in ("", None):
            return None
        return value


settings = Settings()
