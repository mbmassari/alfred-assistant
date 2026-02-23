import json
import os
from pathlib import Path

from ..config import settings


class SecretManager:
    READONLY_SECRETS = Path("/run/secrets")

    @property
    def _dir(self) -> Path:
        writable_dir = Path("/data/secrets")
        writable_dir.mkdir(parents=True, exist_ok=True)
        return writable_dir

    def read(self, name: str) -> str | None:
        value = self._read_writable(name)
        if value is not None:
            return value
        return self._read_readonly(name)

    def _read_writable(self, name: str) -> str | None:
        path = self._dir / name
        if not path.exists():
            return None
        value = path.read_text().strip()
        if value == "CHANGE_ME" or not value:
            return None
        return value

    def _read_readonly(self, name: str) -> str | None:
        path = self.READONLY_SECRETS / name
        if not path.exists():
            return None
        value = path.read_text().strip()
        if value == "CHANGE_ME" or not value:
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
                        masked = self._mask_string(str(v))
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
