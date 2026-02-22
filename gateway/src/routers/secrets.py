from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import verify_token
from ..db import get_session
from ..models import Secret
from ..services.secret_manager import secret_manager

router = APIRouter(
    prefix="/api/v1/secrets",
    tags=["secrets"],
    dependencies=[Depends(verify_token)],
)


class SecretCreate(BaseModel):
    name: str
    display_name: str
    category: str
    scope: str = "private"
    env_var: str
    value: str


class SecretUpdate(BaseModel):
    value: str | None = None
    display_name: str | None = None
    scope: str | None = None


@router.get("")
async def list_secrets(
    category: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    """List all secret definitions with their configuration status."""
    query = select(Secret).order_by(Secret.category, Secret.name)
    if category:
        query = query.where(Secret.category == category)

    result = await session.execute(query)
    secrets = result.scalars().all()

    return {
        "secrets": [
            {
                "name": s.name,
                "display_name": s.display_name,
                "category": s.category,
                "scope": s.scope,
                "env_var": s.env_var,
                "is_configured": s.is_configured,
                "masked_value": secret_manager.get_masked(s.name),
                "updated_at": s.updated_at.isoformat() if s.updated_at else None,
            }
            for s in secrets
        ]
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_secret(
    body: SecretCreate,
    session: AsyncSession = Depends(get_session),
):
    """Create a new secret definition and store its value."""
    existing = await session.get(Secret, body.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Secret '{body.name}' already exists. Use PUT to update.",
        )

    secret_manager.write(body.name, body.value)

    secret = Secret(
        name=body.name,
        display_name=body.display_name,
        category=body.category,
        scope=body.scope,
        env_var=body.env_var,
        is_configured=True,
    )
    session.add(secret)
    await session.commit()

    return {"name": body.name, "status": "created"}


@router.put("/{name}")
async def update_secret(
    name: str,
    body: SecretUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Update a secret's value and/or metadata."""
    secret = await session.get(Secret, name)
    if not secret:
        raise HTTPException(status_code=404, detail=f"Secret '{name}' not found")

    if body.value is not None:
        secret_manager.write(name, body.value)
        secret.is_configured = True

    if body.display_name is not None:
        secret.display_name = body.display_name
    if body.scope is not None:
        secret.scope = body.scope

    secret.updated_at = datetime.now(timezone.utc)
    await session.commit()

    return {"name": name, "status": "updated"}


@router.delete("/{name}")
async def delete_secret(
    name: str,
    session: AsyncSession = Depends(get_session),
):
    """Delete a secret's value (keeps the definition)."""
    secret = await session.get(Secret, name)
    if not secret:
        raise HTTPException(status_code=404, detail=f"Secret '{name}' not found")

    secret_manager.delete(name)
    secret.is_configured = False
    secret.updated_at = datetime.now(timezone.utc)
    await session.commit()

    return {"name": name, "status": "deleted"}


@router.post("/{name}/test")
async def test_secret(
    name: str,
    session: AsyncSession = Depends(get_session),
):
    """Test if a secret is configured and has a non-placeholder value."""
    secret = await session.get(Secret, name)
    if not secret:
        raise HTTPException(status_code=404, detail=f"Secret '{name}' not found")

    value = secret_manager.read(name)
    return {
        "name": name,
        "is_configured": value is not None,
        "has_value": value is not None and len(value) > 0,
    }
