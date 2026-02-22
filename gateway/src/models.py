from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class Secret(Base):
    __tablename__ = "secrets"

    name = Column(String, primary_key=True)
    display_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    scope = Column(String, default="private")
    env_var = Column(String, nullable=True)
    secret_type = Column(String, default="api_key")
    is_configured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    action = Column(String, nullable=False, index=True)  # e.g. "secret.update", "agent.message"
    detail = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
