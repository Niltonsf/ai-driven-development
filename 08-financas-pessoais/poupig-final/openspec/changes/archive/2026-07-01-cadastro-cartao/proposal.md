## Why

O aplicativo Poupig já suporta cadastro de contas bancárias, mas não possui suporte a cartões de crédito — um dos principais instrumentos financeiros dos usuários. Adicionar o módulo de cartões permite que os usuários registrem seus cartões, acompanhem limites e organizem suas finanças de forma mais completa.

## What Changes

- Novo módulo `credit-card` com entidade, repositório e casos de uso no pacote de domínio (`modules/credit-card`)
- Enum `CardBrand` com as principais bandeiras de cartão (VISA, MASTERCARD, ELO, AMEX, HIPERCARD, DINERS, OTHER)
- API REST com endpoints para criar, listar, atualizar e excluir (soft delete) cartões
- Modelo Prisma e migration para persistência da tabela `card`
- Seed com 5 cartões de exemplo para o usuário `usuario@formacao.dev`
- Página e componentes de frontend para listagem e formulário de cartões
- Menu lateral atualizado com link para `/cards` dentro do grupo de cadastros

## Capabilities

### New Capabilities

- `credit-card-management`: Gerenciamento completo de cartões de crédito — criação, listagem, edição e exclusão lógica, com campos específicos como bandeira, últimos 4 dígitos, dias de fechamento e vencimento da fatura e limite.

### Modified Capabilities

- `sidebar-navigation`: Adição do link `/cards` ao grupo de cadastros já existente no menu lateral da área privada.

## Impact

- **Novo pacote**: `modules/credit-card` com entidade, value objects, repositório, DTO, query CQRS e casos de uso
- **Backend**: novo model Prisma `Card`, migration, implementação `credit-card.prisma.ts`, `credit-card.controller.ts` e seed `credit-cards.json`
- **Frontend**: nova rota `/cards`, página `credit-cards.page.tsx` com paginação (controles de página, pageSize padrão 20), componentes `credit-card-list.component.tsx` e `credit-card-form.component.tsx`, client `credit-card-api.client.ts`, schema de validação e hooks
- **Menu lateral**: alteração no componente de navegação para incluir o link de cartões
- **Dependências**: sem novas dependências externas; usa a infraestrutura existente de JWT, Prisma, NestJS e Next.js
