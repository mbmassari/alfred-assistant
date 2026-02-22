import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from .config import settings
from .db import async_session, init_db
from .models import AuditLog
from .routers import agent, audit, health, secrets
from .services.credential_injector import seed_default_secrets

logger = logging.getLogger("alfred.gateway")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.basicConfig(level=settings.log_level.upper())
    logger.info("Alfred Gateway starting...")
    await init_db()
    await seed_default_secrets()
    logger.info("Database initialized, default secrets seeded.")
    yield
    logger.info("Alfred Gateway shutting down.")


app = FastAPI(
    title="Alfred Gateway",
    description="Personal AI assistant gateway",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def audit_middleware(request: Request, call_next):
    """Log all authenticated API calls to the audit log."""
    response = await call_next(request)

    # Only audit non-health, non-docs endpoints
    path = request.url.path
    if path in ("/health", "/docs", "/openapi.json", "/redoc"):
        return response

    if response.status_code < 400:  # Only log successful requests
        try:
            async with async_session() as session:
                log_entry = AuditLog(
                    timestamp=datetime.now(timezone.utc),
                    action=f"{request.method} {path}",
                    detail=f"status={response.status_code}",
                    ip_address=request.client.host if request.client else None,
                )
                session.add(log_entry)
                await session.commit()
        except Exception as e:
            logger.warning(f"Failed to write audit log: {e}")

    return response


# Register routers
app.include_router(health.router)
app.include_router(audit.router)
app.include_router(secrets.router)
app.include_router(agent.router)


@app.get("/auth/verify")
async def verify_auth():
    """Public endpoint to check if auth is configured."""
    token = settings.get_auth_token()
    return {"configured": bool(token)}
