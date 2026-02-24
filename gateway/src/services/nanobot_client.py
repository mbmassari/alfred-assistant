import asyncio
import logging

from ..config import settings

logger = logging.getLogger("alfred.gateway")


class NanobotClient:

    async def send_message(self, message: str, context: dict | None = None) -> dict:
        try:
            proc = await asyncio.create_subprocess_exec(
                "docker", "exec", "alfred-nanobot",
                "nanobot", "agent", "-m", message,
                "--no-markdown",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120.0)
            output = stdout.decode().strip()

            lines = [l for l in output.splitlines() if l.strip() and not l.startswith("🐈")]
            response = "\n".join(lines).strip()

            return {"response": response, "status": "ok"}
        except asyncio.TimeoutError:
            return {"error": "Timeout", "status": "failed"}
        except Exception as e:
            logger.error(f"Nanobot exec failed: {e}")
            return {"error": str(e), "status": "failed"}

    async def health(self) -> bool:
        try:
            proc = await asyncio.create_subprocess_exec(
                "docker", "exec", "alfred-nanobot", "nanobot", "status",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            await asyncio.wait_for(proc.communicate(), timeout=5.0)
            return proc.returncode == 0
        except Exception:
            return False


nanobot_client = NanobotClient()
