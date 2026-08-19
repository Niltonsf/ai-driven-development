# Prerequisite check (Fase 0)

Esta skill é montada **sobre** os primitivos gerados pela skill `ui-template-admin-primitives-to-nextjs`. Sem eles, a skill não tem vocabulário visual mínimo. Esta verificação é um **gate hard**: se falhar, abortar.

## Passo 1 — Existência do diretório de primitivos

```bash
test -d <projeto>/src/shared/components/ui
```

- Não existe → **abortar** com:
  > A pasta `src/shared/components/ui/` não foi encontrada. Esta skill exige que os primitivos tenham sido gerados antes pela skill `ui-template-admin-primitives-to-nextjs`. Execute essa skill primeiro e depois rode esta novamente.

## Passo 2 — Helper `cn()`

```bash
test -f <projeto>/src/shared/utils/cn.ts
```

- Não existe → abortar com a mesma mensagem (helper é criado pela skill de primitivos).

## Passo 3 — Index e mapeamento de primitivos

Ler `src/shared/components/ui/index.ts`. Construir mapa `nomeArquivo → símboloExportado`.

Listar arquivos do diretório (ignorando `index.ts`). Identificar primitivos por nome. Esperar pelo menos:

- **Obrigatórios**: `button`, `input`, `label`, e ao menos um entre `badge` ou `chip`
- **Comuns** (verificar e listar quais existem): `textarea`, `form-field`, `select`, `checkbox`, `radio`, `switch`, `avatar`, `alert`, `tooltip`, `divider`, `spinner`, `progress`, `icon-button`, `tag`

Se faltar um obrigatório, abortar com:
> Os primitivos a seguir são obrigatórios e não foram encontrados em `src/shared/components/ui/`: `<lista>`. Execute antes a skill `ui-template-admin-primitives-to-nextjs` para gerar o vocabulário primitivo, depois rode esta novamente.

## Passo 4 — Captura de convenção de nomenclatura

Inspecionar a estrutura existente para extrair o padrão que os compostos seguirão (decisão deve ser idêntica para coexistência visual):

1. **Formato do filename**: `kebab-case.component.tsx` vs `kebab-case.tsx` vs `PascalCase.tsx` — registrar.
2. **Subpastas vs arquivos planos**: alguns primitivos podem estar em subpastas (`form-field/form-field.component.tsx` + `index.ts`). Registrar quando se usa pasta (geralmente quando há subpartes).
3. **Padrão de export**: `export const Button` (nomeado) vs `export default Button`. Registrar — compostos seguirão o mesmo.
4. **Padrão do `index.ts`**: re-export agregador (`export * from './button.component'`) vs export curado nomeado (`export { Button } from './button.component'`). Registrar e seguir.
5. **Uso de `forwardRef`**: confirmar que primitivos focáveis usam — compostos focáveis seguirão.

Salvar essas decisões para usar consistentemente em toda a Fase 4.

## Passo 5 — Dependências de runtime

Verificar `package.json` no projeto destino:

- `class-variance-authority` ✓
- `clsx` ✓
- `tailwind-merge` ✓
- Ícone library (a mesma já instalada — não trocar)

Faltando algum → abortar com instrução para rodar a skill de primitivos.

Radix packages (`@radix-ui/react-dialog`, `@radix-ui/react-popover`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tooltip`) e `sonner` **não** são pré-requisitos — esta skill instala apenas o que os compostos identificados na Fase 1 efetivamente usam.

## Passo 6 — Tailwind config

Ler `tailwind.config.{ts,js}`. Confirmar que existe `theme.extend.colors.ui` (criado pela skill de primitivos). Esta skill **expandirá** esse namespace na Fase 2 — não cria namespace novo.

## Output da Fase 0

Apresentar ao usuário um resumo curto antes de seguir para a Fase 1:

- Primitivos disponíveis: `<lista>`
- Convenção de filename: `<formato>`
- Convenção de export: `<nomeado/default>`
- Tailwind `ui.*` presente: ✓
- Helper `cn()` presente: ✓
- Biblioteca de ícones detectada: `<nome>`

Pronto para Fase 1.
