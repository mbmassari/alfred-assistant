#!/bin/bash
set -e

echo "Alfred Nanobot — configuring network isolation..."

# ============================================
# Egress allowlist via iptables
# ============================================

configure_firewall() {
    # Firewall desativado temporariamente para teste
    # TODO: Reativar com configuração correta de DNS
    echo "WARNING: Firewall disabled for testing. Enable before production!"
    return 1
}

if configure_firewall 2>/dev/null; then
    echo "Firewall rules applied successfully."
else
    echo "WARNING: Could not configure iptables (missing NET_ADMIN capability?)."
    echo "Container will run WITHOUT egress filtering."
fi

echo ""
echo "Alfred Nanobot — configuring nanobot..."

mkdir -p /root/.nanobot

echo "Injecting environment variables into config..."
python3 -c "
import json
import os
import shutil

config_path = '/app/config/base-config.json'
output_path = '/root/.nanobot/config.json'

with open(config_path, 'r') as f:
    config = json.load(f)

# Inject API key
if 'providers' in config and 'openrouter' in config['providers']:
    api_key = os.environ.get('OPENROUTER_API_KEY', '')
    if api_key:
        config['providers']['openrouter']['apiKey'] = api_key

with open(output_path, 'w') as f:
    json.dump(config, f, indent=2)

print('Config written successfully')
"

# O workspace do nanobot é o vault do Obsidian (/vault), configurado via
# NANOBOT_AGENTS__DEFAULTS__WORKSPACE=/vault no docker-compose.yml.
# Skills, bootstrap files (AGENTS.md, SOUL.md, USER.md) e memória ficam todos em /vault.
if [ -d /vault ]; then
    echo "Vault found at /vault — workspace is ready."
else
    echo "ERROR: /vault not mounted. Check docker-compose volumes."
    exit 1
fi

echo ""
echo "Alfred Nanobot — starting..."

exec nanobot gateway --port 18790
