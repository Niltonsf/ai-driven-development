# dropdown-patterns.md

Padrões comuns de dropdowns que aparecem em topbars admin. Para cada padrão, qual a estrutura interna típica e quais campos do `TopbarDropdownItem` extrair.

> **Regra**: replicar o que o template tem. Se o template não tem header, NÃO inventar header. Se o template tem footer "Ver todas", manter o texto exato.

## 1. Notificações

Dropdown mais comum. Largura típica 360–400px, lista scrollável (max-height ~480px).

### Estrutura interna

- **Header**: título "Notifications" / "Notificações" + ação rápida ("Mark all as read") à direita
- **Lista de itens**: cada item tem
  - Avatar circular OU ícone colorido (cor por tipo: info azul, sucesso verde, alerta laranja, erro vermelho)
  - Título (bold)
  - Subtítulo / preview do conteúdo (1-2 linhas, truncado)
  - Timestamp ("2h ago", "Yesterday")
  - Indicador de não-lido (ponto azul à direita ou bg levemente diferente)
- **Footer**: link "View all notifications"

### Tipos sugeridos

```ts
type NotificationItem = {
  id: string;
  avatarSrc?: string;
  iconName?: string;
  iconColor?: 'info' | 'success' | 'warning' | 'error';
  title: string;
  subtitle?: string;
  timestamp: string; // já formatado, sem lógica
  unread?: boolean;
};
```

## 2. Mensagens

Estrutura semelhante a notificações, mas com avatar do remetente sempre presente.

- **Header**: "Messages" + contador
- **Lista**: avatar + nome do remetente + preview da mensagem + timestamp + badge de não-lidas
- **Footer**: "View all messages"

## 3. User menu (perfil)

Largura menor (200–260px). Mais comum em todas as topbars admin.

### Estrutura

- **Header**: avatar grande + nome + email/role (alguns templates colocam o avatar fora do dropdown, no botão)
- **Lista de ações**:
  - Ícone à esquerda + label
  - Itens típicos: "My Profile", "Settings", "Billing", "Pricing", "FAQ"
  - Possível badge ao lado de algum item ("Pro", "New")
- **Divisor**
- **Item de logout** (geralmente em vermelho ou com ícone de saída)

### Tipos

```ts
type UserMenuItem = {
  id: string;
  icon?: string;
  label: string;
  href?: string;
  badge?: string;
  variant?: 'default' | 'danger';
  divider?: boolean; // se true, é apenas um <hr>
};
```

## 4. Idioma

Largura mínima (160–200px). Lista simples.

### Estrutura

- **Lista de idiomas**:
  - Bandeira (emoji ou SVG) + nome do idioma
  - Indicador de selecionado (checkmark à direita ou bg ativo)

```ts
type LanguageItem = {
  code: string; // 'en', 'pt-BR', 'es'
  label: string; // 'English', 'Português', 'Español'
  flagEmoji?: string;
  flagSrc?: string;
  active?: boolean;
};
```

## 5. Atalhos / quick actions

Grid 3x3 ou 2x4 de ícones com labels curtos. Acionado por ícone de "apps" (geralmente um quadrado com pontos).

### Estrutura

- **Header**: "Shortcuts" + botão "+" para adicionar
- **Grid**: ícone colorido + label de 1-2 palavras + (opcional) subtítulo
- **Footer**: opcional

```ts
type ShortcutItem = {
  id: string;
  icon: string;
  label: string;
  subtitle?: string;
  iconBg?: string; // cor de fundo do quadrado do ícone
  href?: string;
};
```

## 6. Cart / carrinho (raro em admin, comum em e-commerce admin)

- Header: contador de itens
- Lista: thumb + nome do produto + qtd × preço + botão remover
- Footer: total + CTA "Checkout"

## Padrões transversais

### Posicionamento

- Botão de ação à direita → dropdown abre alinhado à **right-0** do botão (raramente centralizado)
- Offset vertical típico: `top-[calc(100%+8px)]` ou `mt-2`

### Animação

A maioria dos templates abre o dropdown com:

```
opacity-0 translate-y-1 scale-95 → opacity-100 translate-y-0 scale-100
```

Duração 150–200ms, easing `ease-out` na entrada, `ease-in` na saída.

Implementação Tailwind sem libs: render condicional + classes baseadas em `isOpen`.

### Seta apontando para o botão (nem todo template tem)

Implementada com pseudo-elemento `::before` no painel do dropdown, posicionado em `top: -6px` + `right: 12px`, formato triângulo via `border-bottom: 6px solid <bg-do-dropdown>` e laterais transparentes. Quando o template tem, registrar e implementar via `globals.css` escopado (não dá para fazer triângulo limpo só com Tailwind).

### Header e footer dos dropdowns — quando dividir

- **Header**: `<div class="topbar-dropdown-header">...</div>` com `border-b` e `padding`
- **Lista**: `<ul role="menu">` com `overflow-y-auto max-h-[...]`
- **Footer**: `<div class="topbar-dropdown-footer">...</div>` com `border-t` e padding

Se o template não usa um dos três, **não criar**. Manter `topbar-dropdown.component.tsx` flexível com `header?` e `footer?` opcionais.
