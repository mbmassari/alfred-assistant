#!/bin/bash
set -e

BACKUP_DIR="${BACKUP_DIR:-/tmp/alfred-backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/vault_$TIMESTAMP.tar.gz"

mkdir -p "$BACKUP_DIR"

# Copy vault from Docker volume to temp, then tar
TEMP_DIR=$(mktemp -d)
docker cp alfred-obsidian-mcp:/vault "$TEMP_DIR/vault"
tar -czf "$BACKUP_FILE" -C "$TEMP_DIR" vault
rm -rf "$TEMP_DIR"

echo "Vault backed up to: $BACKUP_FILE"

# Keep only last 10 backups
ls -t "$BACKUP_DIR"/vault_*.tar.gz | tail -n +11 | xargs -r rm --
echo "Old backups cleaned (keeping last 10)."
