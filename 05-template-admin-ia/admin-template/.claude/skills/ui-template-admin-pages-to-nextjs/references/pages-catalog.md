# Pages catalog

## Conjunto mínimo obrigatório (gerar SEMPRE)

| Página | Rota | Notas | Fidelidade |
|--------|------|-------|------------|
| Dashboard | `(admin)/dashboard` | Página mais importante da vitrine. Replicar bloco-a-bloco. Ver `dashboard-fidelity-guide.md`. | ALTA quando há equivalente |
| Lista de usuários | `(admin)/users` | Domínio principal do template (pode ser produtos/pedidos/alunos se for o caso). DataTable + toolbar + paginação + modal de delete. | MÉDIA |
| Detalhe de usuário | `(admin)/users/[id]` | Layout 2 colunas: sidebar com avatar+resumo, principal com abas. | MÉDIA |
| Profile | `(admin)/profile` | Perfil em primeira pessoa. Abas de edição com FormSection. | MÉDIA |
| Settings | `(admin)/settings` | Abas: account, security, notifications, appearance, billing. FormSection + FormFooter. | MÉDIA |
| Login + Registro + Esqueci | `(auth)/auth` | Mesma rota com `?mode=login|register|forgot`. Layout compartilhado. Ver `auth-fidelity-guide.md`. | ALTA |
| 404 | `not-found.tsx` (raiz) | Sem shell. | ALTA |
| 500 / erro | `error.tsx` (raiz) | Sem shell. | ALTA quando há equivalente |

## Conjunto adicional (gerar APENAS se o template tiver)

### Auth extras
- Lock screen → `(auth)/auth?mode=lock`
- Two-step verification → `(auth)/auth?mode=verify`
- Reset password → `(auth)/auth?mode=reset`
- Verify email → `(auth)/auth?mode=verify-email`

### App-style
- Kanban → `(admin)/apps/kanban`
- Calendar → `(admin)/apps/calendar`
- Chat → `(admin)/apps/chat`
- Inbox / Email → `(admin)/apps/inbox`
- File manager → `(admin)/apps/files`
- Todo → `(admin)/apps/todo`

### E-commerce admin
- Products list/detail → `(admin)/products`, `(admin)/products/[id]`
- Orders → `(admin)/orders`, `(admin)/orders/[id]`
- Invoices → `(admin)/invoices`, `(admin)/invoices/[id]`
- Customers → `(admin)/customers`, `(admin)/customers/[id]`

### Educational
- Courses → `(admin)/courses`
- Students → `(admin)/students`

### Outros comuns
- Pricing page → `(admin)/pricing`
- FAQ / Help center → `(admin)/help`
- Maintenance → `(admin)/maintenance` ou rota pública

## Heurísticas de detecção (nome de arquivo HTML → arquétipo)

```
^(index|dashboard|home|analytics|main)(\W|$)             → dashboard
^(login|sign-?in)                                        → auth/login
^(register|sign-?up)                                     → auth/register
^(forgot|reset)-?password                                → auth/forgot|reset
^(lock|locked)                                           → auth/lock
^(two-?step|2fa|verify)                                  → auth/verify
^(404|page-404|error-404|not-found)                      → 404
^(500|page-500|error-500|server-error)                   → 500
^(403|maintenance|coming-soon)                           → error variants
^(profile|account)(\W|$)                                 → profile
^(settings|preferences|account-settings)                 → settings
^(users|user-list|members|team)                          → users list
^user-(view|details|profile)                             → user detail
^(products?|catalog)                                     → products list
^(orders?|sales)                                         → orders list
^(invoices?|bills)                                       → invoices
^(customers?|clients?)                                   → customers
^(kanban|board)                                          → kanban
^(calendar|events?)                                      → calendar
^(chat|messages?)                                        → chat
^(inbox|mail|email)                                      → inbox
^(file-?manager|files)                                   → file manager
^(pricing|plans)                                         → pricing
^(faq|help|support)                                      → help
```

## Regra geral

- Mínimo: SEMPRE gerar.
- Adicional: gerar apenas se o template tem HTML claramente intencional (não placeholder).
- Rotas referenciadas no menu da app destino: SEMPRE gerar (ver `menu-integrity-protocol.md`). Se o menu cita uma rota que o catálogo não cobre, gerar uma página minimalista com `<PageHeader>` + `<EmptyState>` explicando "Em construção".
