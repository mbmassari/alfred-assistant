"""
Obsidian MCP Server — HTTP/SSE transport.

Exposes vault operations as MCP-compatible tools over HTTP.
Operates on the filesystem mounted at /vault.
"""

import json
import logging
import os
import re
from datetime import datetime
from pathlib import Path

import yaml
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("obsidian-mcp")

VAULT_ROOT = Path(os.environ.get("VAULT_ROOT", "/vault"))
VAULT_ROOT.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Obsidian MCP Server", version="0.1.0")


# ============================================
# Frontmatter helpers
# ============================================

FRONTMATTER_REGEX = re.compile(r'^---\n(.*?)\n---\n', re.DOTALL)


def parse_note(content: str) -> tuple[dict, str]:
    """Parse markdown note, separating frontmatter from body."""
    match = FRONTMATTER_REGEX.match(content)
    if match:
        frontmatter_str = match.group(1)
        body = content[match.end():]
        try:
            frontmatter = yaml.safe_load(frontmatter_str) or {}
        except yaml.YAMLError:
            frontmatter = {}
        return frontmatter, body
    return {}, content


def serialize_note(frontmatter: dict, body: str) -> str:
    """Serialize note with frontmatter."""
    if not frontmatter:
        return body
    
    frontmatter['atualizado_em'] = datetime.now().strftime('%Y-%m-%d %H:%M')
    
    yaml_content = yaml.dump(frontmatter, default_flow_style=False, allow_unicode=True)
    return f"---\n{yaml_content}---\n{body}"


# ============================================
# Helpers
# ============================================


def safe_path(path: str) -> Path:
    """Resolve path within vault, preventing traversal attacks."""
    resolved = (VAULT_ROOT / path).resolve()
    if not str(resolved).startswith(str(VAULT_ROOT.resolve())):
        raise HTTPException(status_code=400, detail="Path traversal not allowed")
    return resolved


# ============================================
# Tool implementations
# ============================================


def vault_read_note(path: str) -> dict:
    """Read a markdown note from the vault with parsed frontmatter."""
    file_path = safe_path(path)
    if not file_path.exists():
        return {"error": f"Note not found: {path}"}
    if not file_path.is_file():
        return {"error": f"Not a file: {path}"}
    
    content = file_path.read_text(encoding="utf-8")
    frontmatter, body = parse_note(content)
    
    return {
        "path": path,
        "frontmatter": frontmatter,
        "body": body,
        "content": content,
        "has_frontmatter": bool(frontmatter)
    }


def vault_write_note(path: str, content: str, frontmatter: dict | None = None) -> dict:
    """Create or overwrite a note in the vault with optional frontmatter."""
    file_path = safe_path(path)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    if frontmatter is None:
        frontmatter = {
            "tags": [],
            "data_criacao": datetime.now().strftime('%Y-%m-%d')
        }
    elif "data_criacao" not in frontmatter:
        frontmatter["data_criacao"] = datetime.now().strftime('%Y-%m-%d')
    
    full_content = serialize_note(frontmatter, content)
    file_path.write_text(full_content, encoding="utf-8")
    
    return {
        "path": path,
        "status": "written",
        "size": len(full_content),
        "frontmatter": frontmatter
    }


def vault_append_note(path: str, content: str) -> dict:
    """Append content to an existing note (creates if not exists)."""
    file_path = safe_path(path)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    if file_path.exists():
        existing_content = file_path.read_text(encoding="utf-8")
        frontmatter, body = parse_note(existing_content)
        new_body = body + "\n\n" + content
        full_content = serialize_note(frontmatter, new_body)
    else:
        frontmatter = {"data_criacao": datetime.now().strftime('%Y-%m-%d')}
        full_content = serialize_note(frontmatter, content)
    
    file_path.write_text(full_content, encoding="utf-8")
    return {
        "path": path,
        "status": "appended",
        "appended_size": len(content)
    }


def vault_update_frontmatter(path: str, updates: dict) -> dict:
    """Update frontmatter of an existing note."""
    file_path = safe_path(path)
    if not file_path.exists():
        return {"error": f"Note not found: {path}"}
    
    content = file_path.read_text(encoding="utf-8")
    frontmatter, body = parse_note(content)
    
    frontmatter.update(updates)
    frontmatter["atualizado_em"] = datetime.now().strftime('%Y-%m-%d %H:%M')
    
    full_content = serialize_note(frontmatter, body)
    file_path.write_text(full_content, encoding="utf-8")
    
    return {
        "path": path,
        "status": "updated",
        "frontmatter": frontmatter
    }


def vault_search(query: str, tags: list[str] | None = None) -> dict:
    """Full-text search across all markdown files in the vault."""
    results = []
    query_lower = query.lower()

    for md_file in VAULT_ROOT.rglob("*.md"):
        try:
            text = md_file.read_text(encoding="utf-8")
            frontmatter, body = parse_note(text)
            
            if query_lower in body.lower():
                lines = body.split("\n")
                matches = [
                    {"line": i + 1, "text": line.strip()}
                    for i, line in enumerate(lines)
                    if query_lower in line.lower()
                ]
                
                rel_path = str(md_file.relative_to(VAULT_ROOT))
                results.append({
                    "path": rel_path,
                    "frontmatter": frontmatter,
                    "matches": matches[:5],
                    "score": len(matches)
                })
        except Exception:
            continue

    if tags:
        results = [r for r in results if any(t in r.get("frontmatter", {}).get("tags", []) for t in tags)]

    results.sort(key=lambda x: x.get("score", 0), reverse=True)
    return {"query": query, "results": results, "total_files": len(results)}


def vault_list_files(directory: str = "", include_metadata: bool = False) -> dict:
    """List files and directories in a vault path."""
    dir_path = safe_path(directory) if directory else VAULT_ROOT
    if not dir_path.exists():
        return {"error": f"Directory not found: {directory}"}
    if not dir_path.is_dir():
        return {"error": f"Not a directory: {directory}"}

    entries = []
    for item in sorted(dir_path.iterdir()):
        rel = str(item.relative_to(VAULT_ROOT))
        entry = {
            "name": item.name,
            "path": rel,
            "type": "directory" if item.is_dir() else "file",
        }
        
        if include_metadata and item.is_file() and item.suffix == '.md':
            try:
                content = item.read_text(encoding="utf-8")
                frontmatter, _ = parse_note(content)
                entry["frontmatter"] = frontmatter
            except Exception:
                pass
        else:
            entry["size"] = item.stat().st_size if item.is_file() else None

        entries.append(entry)

    return {"directory": directory or "/", "entries": entries}


def vault_create_conversation(title: str, assunto: str = "", tags: list[str] | None = None) -> dict:
    """Create a new conversation note with proper frontmatter."""
    today = datetime.now()
    date_str = today.strftime('%Y-%m-%d')
    filename = f"diarios/{date_str}-{title.replace(' ', '-').lower()}.md"
    
    if tags is None:
        tags = ["conversa", "diaria"]
    
    frontmatter = {
        "tags": tags,
        "data": date_str,
        "hora_inicio": today.strftime('%H:%M'),
        "assunto": assunto,
        "data_criacao": date_str,
    }
    
    content = f"""# {title}

## Resumo

<!-- Breve resumo da conversa -->

## Discussão

### Usuário

### Alfred

## Decisões

- 

## Ações

- [ ] 

## Notas

- 
"""
    
    return vault_write_note(filename, content, frontmatter)


# ============================================
# MCP tool registry
# ============================================

TOOLS = {
    "vault_read_note": {
        "description": "Read a markdown note from the Obsidian vault with frontmatter",
        "inputSchema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative path to the note (e.g. 'notes/meeting.md')"}
            },
            "required": ["path"],
        },
        "handler": vault_read_note,
    },
    "vault_write_note": {
        "description": "Create or overwrite a note in the Obsidian vault with frontmatter",
        "inputSchema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative path for the note"},
                "content": {"type": "string", "description": "Markdown content to write"},
                "frontmatter": {"type": "object", "description": "Optional frontmatter metadata"}
            },
            "required": ["path", "content"],
        },
        "handler": vault_write_note,
    },
    "vault_append_note": {
        "description": "Append content to a note in the Obsidian vault",
        "inputSchema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative path to the note"},
                "content": {"type": "string", "description": "Content to append"}
            },
            "required": ["path", "content"],
        },
        "handler": vault_append_note,
    },
    "vault_update_frontmatter": {
        "description": "Update frontmatter metadata of a note",
        "inputSchema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative path to the note"},
                "updates": {"type": "object", "description": "Frontmatter fields to update"}
            },
            "required": ["path", "updates"],
        },
        "handler": vault_update_frontmatter,
    },
    "vault_search": {
        "description": "Full-text search across all notes in the vault",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query string"},
                "tags": {"type": "array", "items": {"type": "string"}, "description": "Filter by tags"}
            },
            "required": ["query"],
        },
        "handler": vault_search,
    },
    "vault_list_files": {
        "description": "List files and directories in the vault",
        "inputSchema": {
            "type": "object",
            "properties": {
                "directory": {"type": "string", "description": "Relative directory path (empty for root)", "default": ""},
                "include_metadata": {"type": "boolean", "description": "Include frontmatter in listing", "default": False}
            },
        },
        "handler": vault_list_files,
    },
    "vault_create_conversation": {
        "description": "Create a new conversation note with proper Obsidian frontmatter",
        "inputSchema": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Title of the conversation"},
                "assunto": {"type": "string", "description": "Main topic/subject of the conversation"},
                "tags": {"type": "array", "items": {"type": "string"}, "description": "Tags for categorization"}
            },
            "required": ["title"],
        },
        "handler": vault_create_conversation,
    },
}


# ============================================
# MCP HTTP endpoints
# ============================================


@app.get("/health")
async def health():
    return {"status": "ok", "vault_path": str(VAULT_ROOT)}


@app.get("/mcp/tools")
async def list_tools():
    """List available MCP tools."""
    return {
        "tools": [
            {"name": name, "description": tool["description"], "inputSchema": tool["inputSchema"]}
            for name, tool in TOOLS.items()
        ]
    }


class ToolCallRequest(BaseModel):
    name: str
    arguments: dict


@app.post("/mcp/call")
async def call_tool(request: ToolCallRequest):
    """Execute an MCP tool call."""
    if request.name not in TOOLS:
        raise HTTPException(status_code=404, detail=f"Unknown tool: {request.name}")

    tool = TOOLS[request.name]
    handler = tool["handler"]

    try:
        result = handler(**request.arguments)
        return {"result": result}
    except TypeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid arguments: {e}")
    except Exception as e:
        logger.error(f"Tool {request.name} failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# MCP JSON-RPC endpoint (for compatibility)
@app.post("/mcp")
async def mcp_jsonrpc(request: Request):
    """Handle MCP JSON-RPC requests."""
    body = await request.json()
    method = body.get("method", "")
    params = body.get("params", {})
    req_id = body.get("id")

    if method == "tools/list":
        result = {
            "tools": [
                {"name": name, "description": tool["description"], "inputSchema": tool["inputSchema"]}
                for name, tool in TOOLS.items()
            ]
        }
    elif method == "tools/call":
        tool_name = params.get("name", "")
        arguments = params.get("arguments", {})
        if tool_name not in TOOLS:
            return JSONResponse({"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": f"Unknown tool: {tool_name}"}})
        handler = TOOLS[tool_name]["handler"]
        try:
            tool_result = handler(**arguments)
            result = {"content": [{"type": "text", "text": json.dumps(tool_result)}]}
        except Exception as e:
            return JSONResponse({"jsonrpc": "2.0", "id": req_id, "error": {"code": -32000, "message": str(e)}})
    elif method == "initialize":
        result = {
            "protocolVersion": "2024-11-05",
            "capabilities": {"tools": {}},
            "serverInfo": {"name": "obsidian-mcp", "version": "0.2.0"},
        }
    else:
        return JSONResponse({"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": f"Unknown method: {method}"}})

    return JSONResponse({"jsonrpc": "2.0", "id": req_id, "result": result})
