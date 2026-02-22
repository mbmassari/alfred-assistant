# Skill: Instagram Post

Cria posts para Instagram com legenda, hashtags e sugestão de horário.

## Quando usar
- Usuário pede para criar um post para Instagram
- Usuário quer gerar conteúdo visual/social

## Processo

1. **Consultar template** — Leia `templates/instagram-post.md` no vault
2. **Consultar contexto** — Verifique `knowledge-base/` para informações relevantes ao tema
3. **Gerar conteúdo:**
   - Legenda (até 2200 caracteres)
   - 15-25 hashtags relevantes
   - Descrição da arte/imagem sugerida
   - Horário sugerido de publicação
4. **Apresentar para aprovação** — Mostre o draft formatado e aguarde confirmação
5. **Salvar no vault** — Após aprovação, salve em `notes/instagram-YYYY-MM-DD-{tema}.md`

## Regras
- Tom casual-profissional (ver USER.md)
- NUNCA publicar sem aprovação explícita do usuário
- Incluir CTA (call to action) no final da legenda
- Emojis com moderação

## Exemplo de output

```markdown
**Descrição da arte:** Carrossel com 5 slides sobre [tema]

**Legenda:**
[Hook chamativo]

[Desenvolvimento em 2-3 parágrafos curtos]

[CTA: pergunta ou convite]

**Hashtags:**
#tag1 #tag2 ... #tag15

**Horário sugerido:** 12:00 (terça-feira)
```
