import logging

from httpx import AsyncClient, HTTPError

from ..config import settings

logger = logging.getLogger("alfred.gateway")


class NanobotClient:
    """HTTP client for communicating with the Nanobot container."""

    def __init__(self):
        self.base_url = settings.nanobot_url

    async def send_message(self, message: str, context: dict | None = None) -> dict:
        """Send a message to the nanobot and return the response."""
        payload = {"message": message}
        if context:
            payload["context"] = context

        try:
            async with AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json=payload,
                )
                response.raise_for_status()
                return response.json()
        except HTTPError as e:
            logger.error(f"Nanobot request failed: {e}")
            return {"error": str(e), "status": "failed"}

    async def health(self) -> bool:
        """Check if nanobot is reachable."""
        try:
            async with AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/health")
                return response.status_code == 200
        except Exception:
            return False


nanobot_client = NanobotClient()
