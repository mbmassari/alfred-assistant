---
tags: [pessoa, usuario, principal]
nome_completo: Matheus Massari
nome_preferido: Massari
primeira_conversa: 2026-02-22
idioma: português (Brasil)
fuso_horario: America/Sao_Paulo
---

# Matheus Massari

**Usuário principal** do sistema Alfred.

## Informações Básicas
- **Nome completo:** Matheus Massari
- **Como chamar:** Massari
- **Idioma:** Português (Brasil)
- **Fuso horário:** America/Sao_Paulo

## Preferências
- Horário de trabalho: 09:00–18:00
- Comunicação assíncrona preferida
- Não incomodar fora do horário (exceto urgências)

## Redes Sociais
- **Instagram:** Conteúdo visual, tom casual-profissional
- **LinkedIn:** Conteúdo técnico/profissional, tom formal

## Histórico de Conversas

```dataview
TABLE WITHOUT ID
  file.link as "Conversa",
  data as "Data",
  assunto as "Assunto"
FROM "diarios"
WHERE contains(pessoas, "Matheus Massari")
SORT data DESC
```

## Projetos Ativos

```dataview
TABLE WITHOUT ID
  file.link as "Projeto",
  status as "Status"
FROM "projetos"
WHERE contains(pessoas, "Matheus Massari")
SORT file.name
```

---

*Primeira interação: 22/02/2026*