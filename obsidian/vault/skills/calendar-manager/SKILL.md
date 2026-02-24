# Skill: Calendar Manager

Gerencia compromissos e agenda usando Google Calendar API e o vault.

## Quando usar
- Usuário pergunta sobre próximos compromissos
- Usuário quer agendar, mover ou cancelar eventos
- Usuário pede resumo da semana/dia

## Processo

### Consultar agenda
1. Verificar `calendar/upcoming.md` no vault para dados cached
2. Se os dados estiverem desatualizados (>1h), usar Google Calendar API para atualizar
3. Apresentar compromissos formatados

### Criar evento
1. Confirmar: título, data/hora, duração, local (se aplicável)
2. Criar via Google Calendar API
3. Atualizar `calendar/upcoming.md`
4. Confirmar criação ao usuário

### Resumo diário/semanal
1. Buscar eventos do período no Google Calendar
2. Formatar em lista cronológica
3. Destacar conflitos ou gaps
4. Salvar em `notes/agenda-YYYY-MM-DD.md`

## Regras
- Fuso horário: America/Sao_Paulo (ver USER.md)
- Respeitar horário de trabalho (09:00-18:00)
- Alertar sobre conflitos de horário
- Sempre confirmar antes de criar/modificar eventos
- Manter `calendar/upcoming.md` atualizado após cada operação

## Formato de saída

```
📅 Terça, 20/02/2026

09:00 - 10:00  Daily standup (Google Meet)
10:30 - 11:30  Review com cliente X (presencial)
14:00 - 15:00  1:1 com gestor
```
