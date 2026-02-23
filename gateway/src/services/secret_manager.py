import json
import os
from pathlib import Path

from ..config import settings


class SecretManager:
    @property
    def _dir(self) -> Path:
        settings.secrets_dir.mkdir(parents=True, exist_ok=True)
        return settings.secrets_dir

    def read(self, name: str) -> str | None:
        path = self._dir / name
        if not path.exists():
            return None
        value = path.read_text().strip()
        if value == "CHANGE_ME":
            return None
        return value

    def write(self, name: str, value: str) -> None:
        path = self._dir / name
        path.write_text(value)
        os.chmod(path, 0o600)

    def delete(self, name: str) -> bool:
        path = self._dir / name
        if path.exists():
            path.unlink()
            return True
        return False

    def exists(self, name: str) -> bool:
        return self.read(name) is not None

    def get_masked(self, name: str) -> str | None:
        value = self.read(name)
        if not value:
            return None
        
        try:
            data = json.loads(value)
            if isinstance(data, dict):
                parts = []
                for k, v in data.items():
                    if v:
                        masked = self._mask_string(v)
                        parts.append(f"{k}:{masked}")
                return " | ".join(parts) if parts else None
        except (json.JSONDecodeError, TypeError):
            pass
        
        return self._mask_string(value)

    def _mask_string(self, value: str) -> str:
        if len(value) <= 8:
            return "****"
        return f"{value[:4]}...{value[-4:]}"


secret_manager = SecretManager()
