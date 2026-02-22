# Architecture — Assistente Alfred

## Overview

Alfred is a personal AI assistant built on the [Nanobot](https://github.com/HKUDS/nanobot) framework, with a FastAPI gateway for security and management, a Next.js admin panel, and long-term memory via Obsidian vault.

## Components

### 1. Nanobot (AI Agent)
- Core AI agent running Nanobot framework
- Uses OpenRouter as LLM provider (access to Claude, GPT, Gemini, etc.)
- Isolated container with iptables egress allowlist
- Connects to Obsidian MCP for memory
- Resource-limited: 1 CPU, 1GB RAM

### 2. FastAPI Gateway
- Single entry point for all external requests
- Bearer token authentication (single user)
- Secret management (CRUD files on disk, metadata in SQLite)
- Proxy to Nanobot API
- Audit logging of all operations

### 3. Admin Panel (Next.js on Vercel)
- Web UI for managing Alfred
- Pages: Dashboard, Secrets, Audit Log, Settings
- Communicates with Gateway via HTTPS + Bearer token

### 4. Obsidian MCP Server
- Custom MCP server exposing vault operations
- Tools: read, write, append, search, list
- Path traversal protection
- Operates on Docker volume

### 5. Portainer CE
- Container management UI
- Accessible on port 9443

## Network Architecture

```
┌──────────────────────────────────────────────────────┐
│ alfred_frontend (bridge)                              │
│   gateway:8000, portainer:9443                        │
└──────────────┬───────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────┐
│ alfred_backend (bridge, internal)                      │
│   gateway ←→ nanobot:18790                            │
└──────────────┬───────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────┐
│ alfred_mcp (bridge, internal)                         │
│   nanobot ←→ obsidian-mcp:3000                       │
└──────────────────────────────────────────────────────┘
```

- **alfred_frontend**: Exposed to host. Only gateway and portainer.
- **alfred_backend**: Internal only. Gateway talks to Nanobot here.
- **alfred_mcp**: Internal only. Nanobot talks to Obsidian MCP here.

## Data Flow

1. User → Admin Panel (Vercel) → Gateway → Nanobot → LLM (OpenRouter)
2. Nanobot → Obsidian MCP → Vault filesystem
3. Admin Panel → Gateway → Secret files on disk

## Secret Management

Secrets are stored as files in `/data/secrets/` with 0600 permissions. The gateway maintains a SQLite registry mapping secret names to environment variables. The Nanobot never reads secret files directly — the gateway injects credentials via environment variables.
