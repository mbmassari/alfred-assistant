# 🧠 Vault do Alfred

Este é o **vault de memória persistente** do assistente Alfred.

## Estrutura

```
vault/
├── alfred.md              # Índice principal
├── AGENTS.md              # System prompt do Alfred
├── SOUL.md                # Personalidade e comportamento
├── USER.md                # Preferências do usuário
├── diarios/               # Conversas diárias (não versionado)
│   └── YYYY-MM-DD-titulo.md
├── pessoas/               # Pessoas conhecidas (não versionado)
├── conhecimento/          # Base de conhecimento (não versionado)
├── skills/                # Skills do Alfred (calendar, instagram, linkedin...)
├── templates/             # Templates Obsidian
├── notes/                 # Notas rápidas e drafts (não versionado)
├── calendar/              # Cache de eventos do Google Calendar (não versionado)
└── history/               # Histórico geral (não versionado)
```

## Frontmatter

Cada nota contém frontmatter YAML:

```yaml
---
tags: [conversa, diaria]
data: 2026-02-22
hora_inicio: 14:30
hora_fim: 14:45
assunto: configuração do sistema
pessoas: []
projetos: []
duracao_minutos: 15
sentimento: positivo
acao_requerida: false
---
```

## Queries Dataview

O vault usa Dataview para consultas. Certifica-te que tens o plugin Dataview instalado no Obsidian.

## Integração MCP

O servidor MCP permite ao Alfred:
- Criar notas automaticamente
- Atualizar frontmatter
- Buscar conteúdo
- Criar links entre notas
