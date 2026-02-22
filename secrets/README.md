# Secrets Directory

This directory holds secret files used by Docker Secrets. Each file contains a single secret value (no newline at end).

## Initial Setup

Run the initialization script:

```bash
make init-secrets
# or
./scripts/init-secrets.sh
```

This creates placeholder files. You must then edit each one with real values.

## Secret Files

| File | Description | Required |
|------|-------------|----------|
| `gateway_auth_token` | Bearer token for Admin Panel → Gateway auth | Yes |
| `openrouter_api_key` | OpenRouter API key (LLM access) | Yes |
| `brave_search_api_key` | Brave Search API key | No |
| `email_imap_password` | Email IMAP password | No |
| `email_smtp_password` | Email SMTP password | No |
| `telegram_bot_token` | Telegram bot token | No |
| `google_calendar_key` | Google Calendar API key | No |
| `instagram_access_token` | Instagram Graph API token | No |
| `linkedin_access_token` | LinkedIn API token | No |

## Security

- All files must have `0600` permissions (owner read/write only)
- Never commit real secret values to git
- The `.gitignore` excludes everything in this directory except `.gitkeep` and this README
- Use `make rotate-token` to generate a new gateway auth token
