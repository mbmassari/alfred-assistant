from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..auth import verify_token
from ..services.nanobot_client import nanobot_client

router = APIRouter(
    prefix="/api/v1/agent",
    tags=["agent"],
    dependencies=[Depends(verify_token)],
)


class MessageRequest(BaseModel):
    message: str
    context: dict | None = None


@router.post("/message")
async def send_message(body: MessageRequest):
    """Send a message to the Alfred agent and return the response."""
    result = await nanobot_client.send_message(body.message, body.context)
    return result


@router.get("/status")
async def agent_status():
    """Check if the nanobot agent is reachable."""
    is_healthy = await nanobot_client.health()
    return {
        "status": "online" if is_healthy else "offline",
        "nanobot_url": "nanobot:18790",
    }
