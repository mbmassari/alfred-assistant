---
name: obsidian-memory
description: Sistema de memória persistente via Obsidian vault MCP. Substitui o sistema padrão memory/MEMORY.md.
always: true
---

# Sistema de Memória — Obsidian Vault

## IMPORTANTE: Ignorar o sistema padrão

NÃO use `memory/MEMORY.md` nem `memory/HISTORY.md`. O sistema de memória do Alfred é o **Obsidian vault** acessado via MCP server em `http://alfred-obsidian-mcp:3000`.

## Ferramentas disponíveis (via MCP)

- `vault_create_conversation` — Cria nota de conversa em `diarios/`
- `vault_write_note` — Cria ou sobrescreve uma nota
- `vault_append_note` — Adiciona conteúdo ao fim de uma nota existente
- `vault_read_note` — Lê uma nota com frontmatter parseado
- `vault_search` — Busca full-text em todo o vault
- `vault_list_files` — Lista arquivos e diretórios do vault
- `vault_update_frontmatter` — Atualiza metadados de uma nota

## Regra obrigatória: arquivar ao encerrar

**AO FINAL DE TODA CONVERSA**, antes de se despedir, você DEVE:

1. Chamar `vault_create_conversation` com um resumo da conversa
2. Verificar que a chamada retornou sucesso
3. Somente então encerrar

Não espere o usuário pedir. Não pergunte se deve salvar. **Simplesmente faça**.

Se o usuário encerrar abruptamente (tchau, até mais, obrigado, etc.), salve **antes** de responder à despedida.

## Estrutura do vault

| Pasta | Uso |
|---|---|
| `diarios/` | Conversas diárias — formato `YYYY-MM-DD-titulo.md` |
| `conhecimento/` | Fatos e aprendizados duradouros |
| `pessoas/` | Perfis de pessoas |
| `notes/` | Notas rápidas e drafts |
| `calendar/` | Cache de eventos do Google Calendar |

## Quando salvar conhecimento duradouro

Use `vault_write_note` ou `vault_append_note` em `conhecimento/` para:
- Preferências do usuário descobertas na conversa
- Decisões estratégicas tomadas
- Contexto de projetos em andamento
- Qualquer informação que será útil em conversas futuras

## Checklist de arquivamento (execute mentalmente antes de encerrar)

- [ ] Chamei `vault_create_conversation`?
- [ ] A ferramenta retornou sucesso (sem erro)?
- [ ] Há conhecimento novo para salvar em `conhecimento/`?
