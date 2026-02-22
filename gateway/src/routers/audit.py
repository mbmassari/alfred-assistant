from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import verify_token
from ..db import get_session
from ..models import AuditLog

router = APIRouter(prefix="/api/v1/audit", tags=["audit"], dependencies=[Depends(verify_token)])


@router.get("")
async def list_audit_logs(
    action: str | None = Query(None, description="Filter by action type"),
    since: datetime | None = Query(None, description="Filter logs after this datetime"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    """List audit log entries with optional filters."""
    query = select(AuditLog).order_by(AuditLog.timestamp.desc())

    if action:
        query = query.where(AuditLog.action == action)
    if since:
        query = query.where(AuditLog.timestamp >= since)

    query = query.offset(offset).limit(limit)
    result = await session.execute(query)
    logs = result.scalars().all()

    return {
        "logs": [
            {
                "id": log.id,
                "timestamp": log.timestamp.isoformat(),
                "action": log.action,
                "detail": log.detail,
                "ip_address": log.ip_address,
            }
            for log in logs
        ],
        "count": len(logs),
        "offset": offset,
        "limit": limit,
    }
