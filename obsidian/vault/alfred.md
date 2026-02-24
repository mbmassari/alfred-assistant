---
tags: [alfred, indice, vault]
data_criacao: 2026-02-22
criado_por: Alfred
---

# 🧠 Alfred — Memória Eterna

> "Cada conversa é uma página na história da nossa jornada juntos."

Este é o **vault pessoal do Alfred** — o teu assistente pessoal AI. Aqui ficam registradas todas as conversas, decisões, aprendizados e memórias.

## Índice

- [[diarios/]] — Conversas diárias
- [[pessoas/]] — Pessoas e interações
- [[conhecimento/]] — Base de conhecimento
- [[skills/]] — Skills do Alfred
- [[templates/]] — Templates de conteúdo

---

## Conversas Recentes

```dataview
TABLE WITHOUT ID
  file.link as "Conversa",
  data as "Data",
  hora_inicio as "Hora",
  duracao_minutos as "Min"
FROM "diarios"
SORT file.name DESC
LIMIT 10
```

---

## Tarefas Pendentes

```dataview
TASK
FROM ""
WHERE acao_requerida = true
SORT data DESC
```

---

## Estatísticas

| Métrica | Valor |
|---------|-------|
| Total de conversas | `$= this.total` |
| Primeira conversa | `$= this.primeira` |
| Última conversa | `$= this.ultima` |

---

## Buscar por Assunto

```dataview
TABLE WITHOUT ID
  file.link as "Nota",
  data as "Data",
  assunto as "Assunto"
FROM ""
WHERE assunto != null
SORT data DESC
LIMIT 20
```

---

## 🏷️ Nuvem de Tags

```dataview
TABLE WITHOUT ID
  tag as "Tag",
  length(rows) as "Qtd"
FROM ""
FLATTEN tags as tag
WHERE tag != null AND tag != "alfred" AND tag != "indice" AND tag != "vault"
GROUP BY tag
SORT length(rows) DESC
LIMIT 30
```

---

## Como Usar Este Vault

1. **Cada conversa** cria uma nota em `diarios/` com frontmatter automático
2. **Pessoas conhecidas** vão para `pessoas/` com wiki-links
3. **Skills** ficam em `skills/` e são carregadas automaticamente pelo nanobot
4. **Templates** de conteúdo (LinkedIn, Instagram, email) ficam em `templates/`

### Frontmatter de Cada Nota

```yaml
tags: [conversa, diaria]
data: 2026-02-22
hora_inicio: 14:30
assunto: configuração do vault
pessoas: []
projetos: []
duracao_minutos: 15
sentimento: neutro
acao_requerida: false
```

---

*Este vault é mantido pelo Alfred. Cada interação é uma memória.*
