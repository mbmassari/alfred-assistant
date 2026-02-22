import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import async_session
from ..models import Secret
from .secret_manager import secret_manager

logger = logging.getLogger("alfred.gateway")

DEFAULT_SECRETS = [
    {
        "name": "openrouter_api_key",
        "env_var": "OPENROUTER_API_KEY",
        "category": "llm",
        "scope": "common",
        "display_name": "OpenRouter API Key",
    },
    {
        "name": "brave_search_api_key",
        "env_var": "BRAVE_API_KEY",
        "category": "tool",
        "scope": "common",
        "display_name": "Brave Search API Key",
    },
    {
        "name": "email_imap_password",
        "env_var": "NANOBOT_CHANNELS__EMAIL__IMAP_PASSWORD",
        "category": "channel",
        "scope": "private",
        "display_name": "Email IMAP Password",
    },
    {
        "name": "email_smtp_password",
        "env_var": "NANOBOT_CHANNELS__EMAIL__SMTP_PASSWORD",
        "category": "channel",
        "scope": "private",
        "display_name": "Email SMTP Password",
    },
    {
        "name": "telegram_bot_token",
        "env_var": "NANOBOT_CHANNELS__TELEGRAM__TOKEN",
        "category": "channel",
        "scope": "private",
        "display_name": "Telegram Bot Token",
    },
    {
        "name": "google_calendar_key",
        "env_var": "GOOGLE_CALENDAR_API_KEY",
        "category": "tool",
        "scope": "private",
        "display_name": "Google Calendar API Key",
    },
    {
        "name": "instagram_access_token",
        "env_var": "INSTAGRAM_ACCESS_TOKEN",
        "category": "social",
        "scope": "private",
        "display_name": "Instagram Access Token",
    },
    {
        "name": "linkedin_access_token",
        "env_var": "LINKEDIN_ACCESS_TOKEN",
        "category": "social",
        "scope": "private",
        "display_name": "LinkedIn Access Token",
    },
]


async def seed_default_secrets() -> None:
    """Seed the database with default secret definitions (not values)."""
    async with async_session() as session:
        for secret_def in DEFAULT_SECRETS:
            existing = await session.get(Secret, secret_def["name"])
            if existing is None:
                secret = Secret(
                    name=secret_def["name"],
                    display_name=secret_def["display_name"],
                    category=secret_def["category"],
                    scope=secret_def["scope"],
                    env_var=secret_def["env_var"],
                    is_configured=secret_manager.exists(secret_def["name"]),
                )
                session.add(secret)
                logger.info(f"Seeded secret definition: {secret_def['name']}")
            else:
                # Update is_configured status based on file existence
                existing.is_configured = secret_manager.exists(secret_def["name"])

        await session.commit()


def build_env_vars() -> dict[str, str]:
    """Build a dict of environment variables from all configured secrets."""
    env_vars = {}

    # We read the mapping from DEFAULT_SECRETS for simplicity
    # In production, this could also query the DB
    for secret_def in DEFAULT_SECRETS:
        value = secret_manager.read(secret_def["name"])
        if value:
            env_vars[secret_def["env_var"]] = value

    return env_vars
