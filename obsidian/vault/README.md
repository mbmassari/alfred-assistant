# 🧠 Vault do Alfred

Este é o **vault de memória persistente** do assistente Alfred.

## Estrutura

```
alfred/
├── alfred.md              # Índice principal
├── diarios/               # Conversas diárias
│   └── YYYY-MM-DD-titulo.md
├── pessoas/               # Pessoas conhecidas
├── projetos/              # Projetos ativos
├── conhecimento/          # Base de conhecimento
├── decisoes/              # Decisões importantes
├── referencias/           # Links e referências
└── templates/             # Templates Obsidian
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
