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
        "display_name": "OpenRouter",
        "secret_type": "api_key",
        "description": "API para modelos de IA (Claude, GPT, etc.)",
        "help_url": "https://openrouter.ai/keys",
    },
    {
        "name": "brave_search_api_key",
        "env_var": "BRAVE_API_KEY",
        "category": "tool",
        "scope": "common",
        "display_name": "Brave Search",
        "secret_type": "api_key",
        "description": "Motor de busca para pesquisas",
        "help_url": "https://brave.com/search/api",
    },
    {
        "name": "telegram_bot_token",
        "env_var": "NANOBOT_CHANNELS__TELEGRAM__TOKEN",
        "category": "channel",
        "scope": "private",
        "display_name": "Telegram Bot",
        "secret_type": "token",
        "description": "Bot do Telegram para conversar com o Alfred",
        "help_url": "https://t.me/BotFather",
    },
    {
        "name": "google_calendar_key",
        "env_var": "GOOGLE_CALENDAR_API_KEY",
        "category": "tool",
        "scope": "private",
        "display_name": "Google Calendar",
        "secret_type": "api_key",
        "description": "Acesso ao Google Calendar",
        "help_url": "https://console.cloud.google.com",
    },
    {
        "name": "instagram_access_token",
        "env_var": "INSTAGRAM_ACCESS_TOKEN",
        "category": "social",
        "scope": "private",
        "display_name": "Instagram",
        "secret_type": "token",
        "description": "Postar no Instagram",
        "help_url": "https://developers.facebook.com",
    },
    {
        "name": "linkedin_access_token",
        "env_var": "LINKEDIN_ACCESS_TOKEN",
        "category": "social",
        "scope": "private",
        "display_name": "LinkedIn",
        "secret_type": "token",
        "description": "Postar no LinkedIn",
        "help_url": "https://www.linkedin.com/developers",
    },
]


async def seed_default_secrets() -> None:
    """Seed the database with default secret definitions."""
    async with async_session() as session:
        for secret_def in DEFAULT_SECRETS:
            existing = await session.get(Secret, secret_def["name"])
            if existing is None:
                secret = Secret(
                    name=secret_def["name"],
                    display_name=secret_def["display_name"],
                    category=secret_def["category"],
                    scope=secret_def["scope"],
                    env_var=secret_def.get("env_var"),
                    secret_type=secret_def.get("secret_type", "api_key"),
                    is_configured=secret_manager.exists(secret_def["name"]),
                )
                session.add(secret)
                logger.info(f"Seeded secret definition: {secret_def['name']}")
            else:
                existing.is_configured = secret_manager.exists(secret_def["name"])
                existing.display_name = secret_def["display_name"]

        await session.commit()


def build_env_vars() -> dict[str, str]:
    """Build a dict of environment variables from all configured secrets."""
    env_vars = {}
    for secret_def in DEFAULT_SECRETS:
        value = secret_manager.read(secret_def["name"])
        if value and secret_def.get("env_var"):
            env_vars[secret_def["env_var"]] = value
    return env_vars
