#!/bin/bash
set -e

SECRETS_DIR="$(cd "$(dirname "$0")/../secrets" && pwd)"

echo "Initializing secrets in $SECRETS_DIR..."

create_secret() {
    local name="$1"
    local description="$2"
    local file="$SECRETS_DIR/$name"

    if [ -f "$file" ]; then
        echo "  [skip] $name already exists"
    else
        echo "CHANGE_ME" > "$file"
        chmod 600 "$file"
        echo "  [created] $name — $description"
    fi
}

# Generate a random gateway auth token if not exists
if [ ! -f "$SECRETS_DIR/gateway_auth_token" ]; then
    openssl rand -hex 32 > "$SECRETS_DIR/gateway_auth_token"
    chmod 600 "$SECRETS_DIR/gateway_auth_token"
    echo "  [generated] gateway_auth_token — 64-char random token"
else
    echo "  [skip] gateway_auth_token already exists"
fi

create_secret "openrouter_api_key"      "OpenRouter API Key (required for LLM access)"
create_secret "brave_search_api_key"    "Brave Search API Key"
create_secret "email_imap_password"     "Email IMAP Password"
create_secret "email_smtp_password"     "Email SMTP Password"
create_secret "telegram_bot_token"      "Telegram Bot Token"
create_secret "google_calendar_key"     "Google Calendar API Key"
create_secret "instagram_access_token"  "Instagram Access Token"
create_secret "linkedin_access_token"   "LinkedIn Access Token"

echo ""
echo "Done! Edit the files in $SECRETS_DIR with real values."
echo "Files with 'CHANGE_ME' are placeholders."
echo ""
echo "IMPORTANT: gateway_auth_token was auto-generated. Use it in the Admin Panel."
echo "Token: $(cat "$SECRETS_DIR/gateway_auth_token")"
