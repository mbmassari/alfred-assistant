from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_prefix": "ALFRED_"}

    # Paths
    secrets_dir: Path = Path("/run/secrets")
    db_path: Path = Path("/data/gateway.db")

    # Nanobot
    nanobot_url: str = "http://nanobot:18790"

    # Server
    log_level: str = "info"
    gateway_port: int = 8000

    # CORS — Admin Panel domain(s)
    cors_origins: list[str] = ["*"]

    @property
    def database_url(self) -> str:
        return f"sqlite+aiosqlite:///{self.db_path}"

    def get_auth_token(self) -> str:
        """Read the gateway auth token from secrets file."""
        token_file = self.secrets_dir / "gateway_auth_token"
        if token_file.exists():
            return token_file.read_text().strip()
        return ""


settings = Settings()
