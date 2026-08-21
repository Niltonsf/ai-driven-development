# 004-personalizar-aplicacao

## Objetivo

Personalizar a identidade da aplicação antes de seguir com os casos de uso de domínio: definir o nome oficial como **"Banco de Ideias"**, ajustar a marca visual (logo/ícone) para refletir, de forma simples, a ideia de um banco de ideias processado por inteligência artificial, e simplificar a navegação lateral da área privada substituindo o menu modularizado (rail de módulos + seções aninhadas) por um menu lateral único e plano. Como parte da simplificação, remover o módulo de exemplo e suas rotas, criando em seu lugar um Dashboard geral vazio que será evoluído em specs futuras.

## Contexto Técnico

- Mudança restrita ao **frontend** (`apps/frontend`). Sem alterações em backend, módulos de domínio ou pacote `shared`.
- **Identidade da aplicação** hoje aparece como placeholder "Aplicação" em:
  - `apps/frontend/src/app/layout.tsx` (metadata `title`).
  - `apps/frontend/src/app/page.tsx` (wordmark da landing pública).
  - `apps/frontend/src/shared/components/branding/app-logo.component.tsx` (constante `APP_NAME` e `AppLogoMark` usando ícone `Layers` da `lucide-react`).
    O nome oficial passa a ser **"Banco de Ideias"** em todos esses pontos.
- **Marca visual**: a ideia central é "banco de ideias processadas por IA". O `AppLogoMark` deixa de usar `Layers` e passa a usar um ícone da `lucide-react` que comunique essa ideia de forma simplificada — usar `BrainCircuit` (combina cérebro/IA com circuito) como ícone principal. Continua sendo um único ícone `lucide-react`, sem composição custom, sem SVG novo.
- **Menu lateral**: hoje `apps/frontend/src/app/(private)/layout.tsx` alimenta o `SidebarMenu` com `APP_MODULES: ModuleNavigationEntry[]`, que ativa o rail de módulos do componente `SidebarMenu` via `moduleNavigation`. A intenção é deixar de usar essa API e passar uma única lista plana de itens (`sections` direto), sem rail.
- O componente `AppSidebarNavigation` em `apps/frontend/src/shared/navigation/app-sidebar-navigation.component.tsx` existe só para escolher o módulo ativo a partir do `pathname`. Com menu único ele perde propósito — pode ser substituído por uso direto do `SidebarMenu` no layout privado.
- O componente `SidebarMenu` (`apps/frontend/src/shared/components/ui/sidebar-menu.component.tsx`) **não muda**. Ele continua aceitando `moduleNavigation`, apenas deixa de receber esse prop nesta entrega.
- A rota inicial padrão da área privada hoje é `/example/dashboard`. Passa a ser `/dashboard`.
- As rotas de domínio existentes (`/idea-types`, `/ideas`) deixam de aparecer no menu lateral nesta entrega — o menu único expõe **apenas Dashboard**. As rotas em si continuam podendo existir no código, mas voltam para o menu apenas em specs futuras quando seus fluxos estiverem prontos.
- **Logo da aplicação visível em todas as superfícies**: o `AppLogo` (ícone `BrainCircuit` + wordmark "Banco de Ideias") aparece de forma sincronizada na landing pública, na página de autenticação (`/join`) e no topo da sidebar da área privada. A sidebar privada renderiza o logo dentro do próprio menu — expandido mostra ícone + texto, comprimido mostra apenas o ícone. Em nenhuma superfície o logo é removido.
- **Landing page com narrativa de banco de ideias**: o hero da landing pública precisa de título e subtítulo alinhados com a ideia central ("capture ideias, processe com IA, reaproveite quantas vezes precisar"), em vez do copy genérico anterior.

## Referências Compartilhadas

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Observações Locais

- O Dashboard geral entregue aqui é **placeholder**. Conteúdo real (widgets, métricas, agregadores) fica para spec futura — não inventar dados, gráficos nem chamadas de API.
- **Sem refatoração** do `SidebarMenu`. A API `moduleNavigation` permanece no componente mesmo sem uso, para evitar mudança fora de escopo. Limpá-la pode virar tarefa de manutenção em outra spec.
- **Sem novos assets gráficos**. Marca visual usa apenas troca do ícone `lucide-react` existente; não criar SVG, PNG, favicon novo ou wordmark customizado.
- **Sem validação automatizada de UI**. Entrega vai até `npx tsc --noEmit` limpo + build do Next.js verde; conferência visual é manual.
- Nome oficial da aplicação: **"Banco de Ideias"** (com acento e maiúsculas iniciais).
- Ícone da marca: `BrainCircuit` da `lucide-react`.
- Itens do menu único, nesta ordem fixa:

  | Label     | Rota         | Match   | Ícone             |
  | --------- | ------------ | ------- | ----------------- |
  | Dashboard | `/dashboard` | `exact` | `LayoutDashboard` |

  Nesta entrega o menu lateral expõe **somente Dashboard**. Os itens "Tipos de Ideia" e "Ideias" não fazem parte do menu até que suas telas estejam prontas em specs futuras.

## Tasks

### Tasks - Front-end (Identidade)

- [ ] Atualizar `apps/frontend/src/shared/components/branding/app-logo.component.tsx`:
  - Trocar `APP_NAME = 'Aplicação'` por `APP_NAME = 'Banco de Ideias'` e remover o comentário "Substitua APP_NAME pelo nome do seu app".
  - Trocar o ícone do `AppLogoMark` de `Layers` para `BrainCircuit` (importado de `lucide-react`). Manter todas as classes e props como estão — só troca do ícone.

- [ ] Atualizar `apps/frontend/src/app/layout.tsx` para que `metadata.title` seja `'Banco de Ideias'` (e `metadata.description`, se existir, refletir "banco de ideias processadas por IA" em uma frase curta).

- [ ] Atualizar `apps/frontend/src/app/page.tsx` (landing pública):
  - Wordmark do header passa a exibir `Banco de Ideias` (substitui `Aplicação`).
  - Ícones `Layers` (header + hero) trocados por `BrainCircuit`.
  - Hero recebe título e subtítulo alinhados com a ideia de banco de ideias: título em duas linhas com destaque ("Seu banco de ideias / potencializado por IA") e subtítulo curto explicando captura de ideias + prompts + reprocessamento por IA. CTA principal coerente com a narrativa (ex.: "Criar minha primeira ideia").

- [ ] Buscar por `Aplicação` (string exata) em `apps/frontend/src` e confirmar que não sobra nenhuma referência ao nome placeholder do app. Strings genéricas em comentários, mensagens de erro ou textos de UI que usem "aplicação" como palavra comum (minúscula, sem sentido de marca) podem permanecer.

### Tasks - Front-end (Menu)

- [ ] Apagar a pasta `apps/frontend/src/app/(private)/example/` por completo (inclui `example/dashboard/page.tsx`). Garantir que nenhum import ou string `example` remanesça em `apps/frontend/src` após a remoção.

- [ ] Criar a rota `apps/frontend/src/app/(private)/dashboard/page.tsx` como Server Component vazio: apenas título "Dashboard" e um espaço reservado (ex.: `<EmptyListState>` do shared kit ou um `<div>` simples com texto "Em construção"). Sem widgets, sem dados mockados, sem chamadas de API.

- [ ] Atualizar `apps/frontend/src/app/(private)/layout.tsx`:
  - Remover a constante `APP_MODULES: ModuleNavigationEntry[]` e quaisquer constantes de rota não usadas (`EXAMPLE_ROUTE`, `EXAMPLE_DASHBOARD_ROUTE`).
  - Adicionar `DASHBOARD_ROUTE = '/dashboard'`.
  - Passar a alimentar o `SidebarMenu` com uma única `SidebarMenuSection` (sem `label`) contendo **apenas** o item Dashboard descrito em **Observações Locais**.
  - Substituir o uso de `<AppSidebarNavigation modules={...} defaultModuleId="example" />` por uso direto do `SidebarMenu` (sem `moduleNavigation`). Se `AppSidebarNavigation` ficar sem consumidores, **apagar o arquivo** `apps/frontend/src/shared/navigation/app-sidebar-navigation.component.tsx` e a pasta `navigation/` se ficar vazia.

- [ ] Garantir o logo da aplicação visível e sincronizado em todas as superfícies, incluindo a sidebar privada:
  - Landing pública (`apps/frontend/src/app/page.tsx`): `BrainCircuit` + wordmark "Banco de Ideias" no header.
  - Página de autenticação (`apps/frontend/src/app/(public)/join/page.tsx`): mark `BrainCircuit` em destaque + h1 "Banco de Ideias".
  - Área privada: o topo do `SidebarMenu` (caminho de menu plano em `apps/frontend/src/shared/components/ui/sidebar-menu.component.tsx`) renderiza `<AppLogo>` linkando para `/dashboard`. Quando expandido, mostra ícone + wordmark; quando comprimido (`isCollapsed`), mostra apenas o ícone — sem exibir o nome da aplicação.

- [ ] Garantir que o redirecionamento pós-login e qualquer outro `router.push`/`redirect` que apontava para `/example/dashboard` passe a apontar para `/dashboard`. Buscar por `/example` em `apps/frontend/src` para confirmar que não sobra nenhuma referência.

### Tasks - Verificação

- [ ] Rodar `npx tsc --noEmit` em `apps/frontend` e `npm run build` (Next.js) e sinalizar que a UI está pronta para conferência manual:
  - Aba do navegador exibindo o título "Banco de Ideias".
  - Landing pública, página `/join` e sidebar privada exibindo o mesmo par ícone (`BrainCircuit`) + wordmark "Banco de Ideias", sincronizados.
  - Hero da landing exibindo título e subtítulo alinhados com a ideia de banco de ideias processado por IA.
  - Login → cair em `/dashboard`; menu lateral exibindo **apenas o item Dashboard**, sem rail; logo presente no topo da sidebar (ícone + texto expandido, apenas ícone comprimido).

## Resultado Esperado

- Nome da aplicação ("Banco de Ideias") aplicado consistentemente em `metadata.title`, landing pública, página `/join` e wordmark do `AppLogo` na sidebar privada. Nenhuma string `Aplicação` (com sentido de nome do app) remanescente em `apps/frontend/src`.
- Ícone da marca trocado para `BrainCircuit`, refletindo de forma simplificada a ideia de banco de ideias processado por IA.
- Logo (`BrainCircuit` + wordmark "Banco de Ideias") presente e sincronizado em **todas** as superfícies — landing pública, `/join` e sidebar privada. Em nenhuma superfície o logo é removido. Na sidebar, o estado comprimido exibe apenas o ícone, sem o texto do nome da aplicação.
- Hero da landing pública com título e subtítulo alinhados à proposta de banco de ideias processado por IA.
- Pasta `apps/frontend/src/app/(private)/example/` removida e nenhuma referência a `example` remanescente no código do frontend.
- Rota `/dashboard` existente, renderizando uma página vazia com apenas o título e um placeholder.
- Menu lateral da área privada exibindo **apenas o item Dashboard**, sem rail de módulos e sem agrupamento.
- Login redireciona para `/dashboard`.
- `npx tsc --noEmit` e `npm run build` em `apps/frontend` finalizam sem erros.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).
