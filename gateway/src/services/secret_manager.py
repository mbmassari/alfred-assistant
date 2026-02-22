import os
from pathlib import Path

from ..config import settings


class SecretManager:
    """Manages secret files on disk under /data/secrets/."""

    @property
    def _dir(self) -> Path:
        settings.secrets_dir.mkdir(parents=True, exist_ok=True)
        return settings.secrets_dir

    def read(self, name: str) -> str | None:
        """Read a secret value from file. Returns None if not found or placeholder."""
        path = self._dir / name
        if not path.exists():
            return None
        value = path.read_text().strip()
        if value == "CHANGE_ME":
            return None
        return value

    def write(self, name: str, value: str) -> None:
        """Write a secret value to file with 0600 permissions."""
        path = self._dir / name
        path.write_text(value)
        os.chmod(path, 0o600)

    def delete(self, name: str) -> bool:
        """Delete a secret file. Returns True if it existed."""
        path = self._dir / name
        if path.exists():
            path.unlink()
            return True
        return False

    def exists(self, name: str) -> bool:
        """Check if a secret has a real (non-placeholder) value."""
        return self.read(name) is not None

    def get_masked(self, name: str) -> str | None:
        """Get a masked version of the secret (first 4 + last 4 chars)."""
        value = self.read(name)
        if not value:
            return None
        if len(value) <= 8:
            return "****"
        return f"{value[:4]}...{value[-4:]}"


secret_manager = SecretManager()
