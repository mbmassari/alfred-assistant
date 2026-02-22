from fastapi import APIRouter
from httpx import AsyncClient

from ..config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Check gateway and nanobot status."""
    nanobot_ok = False
    try:
        async with AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{settings.nanobot_url}/health")
            nanobot_ok = resp.status_code == 200
    except Exception:
        pass

    return {
        "status": "ok",
        "gateway": "running",
        "nanobot": "connected" if nanobot_ok else "unreachable",
    }
