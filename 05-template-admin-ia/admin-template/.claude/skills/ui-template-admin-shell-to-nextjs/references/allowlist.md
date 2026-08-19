# Allowlist — caminhos que a skill PODE escrever

Qualquer escrita fora desta lista é violação do critério de aceite #5. A Fase 5 verifica.

## Permitido criar/modificar

```
src/shared/template/admin/admin-shell.component.tsx
src/shared/template/admin/menu.component.tsx
src/shared/template/admin/logo.component.tsx
src/shared/template/admin/top-bar.component.tsx          (condicional)
src/shared/template/admin/footer.component.tsx           (condicional)
src/shared/template/admin/menu-toggle.component.tsx      (condicional)
src/shared/template/admin/use-menu-state.hook.ts
src/shared/template/admin/menu-state.context.tsx
src/shared/template/admin/admin-shell.tokens.css

src/app/(private)/layout.tsx
src/app/(private)/dashboard/page.tsx

public/template/admin/logo/*    (apenas quando o logo do template é imagem; um arquivo por variante detectada na Fase 1.4)
```

## Permitido modificar (idempotentemente)

```
src/app/globals.css         ← apenas para adicionar 1 linha @import dos tokens, se ainda não existir
tailwind.config.ts          ← apenas Tailwind v3, apenas em theme.extend, sem remover chaves preexistentes
package.json + lockfile     ← apenas via npm/pnpm/yarn install da biblioteca de ícones detectada
```

## Proibido tocar

- `src/app/layout.tsx` raiz — inalterado.
- `src/app/page.tsx` raiz — inalterado. **Nunca remover, mover, nem sobrescrever.** A rota `/` é responsabilidade do projeto, não desta skill. A rota padrão da área privada é `/dashboard`, garantida por `src/app/(private)/dashboard/page.tsx`.
- Qualquer arquivo em `src/app/(public)/`, `src/app/api/`, ou outros grupos de rota
- Qualquer arquivo em `src/shared/` fora de `template/admin/`
- `tsconfig.json`, `next.config.*`, `eslint.config.*`, `prettier.*`
- Arquivos do template de origem (read-only)

## Em caso de conflito

Se um arquivo da lista "permitido criar" já existe com conteúdo diferente do que a skill geraria:

1. Fazer backup mental do conteúdo atual.
2. Perguntar ao usuário se sobrescreve ou aborta.
3. Nunca sobrescrever silenciosamente.

## Regras de criação de diretórios e arquivos vazios

A allowlist acima é a fonte da verdade — vale **literalmente**, não como prefixo livre.

1. **Só crie diretórios que sejam pais imediatos de arquivos da allowlist.** Os únicos diretórios que esta skill pode criar são:
   - `src/shared/` (se ausente)
   - `src/shared/template/` (se ausente)
   - `src/shared/template/admin/` (sempre necessário)
   - `src/app/(private)/` (sempre necessário)
   - `src/app/(private)/dashboard/` (sempre necessário — abriga o `page.tsx` da rota padrão da área privada)
   - `public/template/`, `public/template/admin/`, `public/template/admin/logo/` (apenas quando há logo imagem; ver Fase 3.2.2)

   Qualquer outro diretório (ex.: `src/components/`, `src/lib/`, `src/hooks/`, `src/types/`, `src/styles/`, `src/features/`, `src/utils/`) **não** deve ser criado por esta skill, mesmo que pareça idiomático. Se já existir no projeto, deixar intacto.

2. **Proibido criar arquivos vazios marcadores.** Nada de `.gitkeep`, `.keep`, `index.ts` placeholder, `README.md` placeholder, ou qualquer outro arquivo cujo único propósito seja preservar uma pasta no git. Se um diretório só faria sentido com um marcador, ele não deveria existir nesta fase — não crie.

3. **Sem efeitos colaterais de scaffold.** A skill não roda `mkdir -p` em árvores especulativas, não chama geradores de boilerplate, não cria estruturas "para uso futuro". Cada diretório criado precisa receber um arquivo da allowlist na mesma execução.

4. **Verificação na Fase 5.** O passo de allowlist da Fase 5 lista também os diretórios novos e falha se algum estiver vazio ou contiver apenas arquivos marcadores. Se isso acontecer, remover o diretório/arquivo extra antes de relatar sucesso.
