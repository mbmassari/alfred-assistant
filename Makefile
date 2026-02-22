.PHONY: up down logs restart build status secrets backup rotate-token

# ============================================
# Assistente Alfred — Makefile
# ============================================

up: ## Start all services
	docker compose up -d

down: ## Stop all services
	docker compose down

logs: ## Follow logs from all services
	docker compose logs -f

logs-gateway: ## Follow gateway logs
	docker compose logs -f gateway

logs-nanobot: ## Follow nanobot logs
	docker compose logs -f nanobot

restart: ## Restart all services
	docker compose restart

restart-nanobot: ## Restart only the nanobot (after secret changes)
	docker compose restart nanobot

build: ## Rebuild all images
	docker compose build

build-no-cache: ## Rebuild all images without cache
	docker compose build --no-cache

status: ## Show status of all services
	docker compose ps

# ============================================
# Secrets
# ============================================

init-secrets: ## Initialize secret files
	chmod +x scripts/init-secrets.sh
	./scripts/init-secrets.sh

rotate-token: ## Generate a new gateway auth token
	openssl rand -hex 32 > secrets/gateway_auth_token
	chmod 600 secrets/gateway_auth_token
	@echo "New token: $$(cat secrets/gateway_auth_token)"
	@echo "Restart gateway to apply: make restart"

# ============================================
# Backup
# ============================================

backup: ## Backup the Obsidian vault
	chmod +x scripts/backup-vault.sh
	./scripts/backup-vault.sh

# ============================================
# Development
# ============================================

shell-gateway: ## Open a shell in the gateway container
	docker compose exec gateway bash

shell-nanobot: ## Open a shell in the nanobot container
	docker compose exec nanobot bash

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
