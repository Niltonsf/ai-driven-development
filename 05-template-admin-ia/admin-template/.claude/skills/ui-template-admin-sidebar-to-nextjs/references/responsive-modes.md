# Responsive Modes — Taxonomia

Templates admin combinam diferentes modos de exibição do sidebar conforme o breakpoint. Identifique no original quais existem e replique exatamente — não invente modos que o template não tem, e não pule modos que ele tem.

## Modos canônicos

### 1. Full (desktop expandido)

- Largura: `widthFull` (ex.: 260px)
- Ícones + labels visíveis
- Grupos expansíveis abrem inline com slide-down ou instantâneo
- Default em `≥ md` ou `≥ lg`

Estado: `mode === 'full'`

### 2. Mini-collapsed (desktop colapsado)

- Largura: `widthMini` (ex.: 64–78px)
- Apenas ícones; labels somem ou aparecem em **tooltip flutuante** ao hover
- Grupos expansíveis: ao hover sobre o ícone, submenus abrem em **flyout** lateral (popover) — NÃO inline
- Acionado por botão de toggle no topbar/sidebar
- Estado pode persistir em localStorage

Estado: `mode === 'mini'`

Cuidado: identificar se o original usa flyout no hover ou se simplesmente não permite navegar grupos no modo mini. Replicar exatamente o que existe.

### 3. Mobile-drawer

- Em `< breakpointMobile`, sidebar fica oculto por default
- Botão hamburguer (geralmente no topbar) abre o drawer da esquerda
- Backdrop escurecido (`bg-black/50`) cobre o conteúdo
- Drawer ocupa `widthFull` (ou maior, ex.: 280px) e desliza de `translate-x-[-100%]` para `translate-x-0`
- Fecha por: clique no backdrop, ESC, botão X dentro do drawer, ou clicar em link

Estado: `mode === 'mobile'`, `drawerOpen: boolean`

### 4. Mobile-overlay (variante)

- Como drawer, mas ocupa **a tela inteira** (100vw) em vez de só uma faixa
- Comum em templates mobile-first

### 5. Hidden (sem replacement em mobile)

- Em mobile, sidebar simplesmente não existe e não há hamburguer
- Navegação migra para top-tabs ou bottom-nav (fora do escopo desta skill)

Se o original usa este modo: documentar e PERGUNTAR ao usuário antes de prosseguir, porque o resultado em mobile será nenhuma navegação visível.

## Combinações comuns

Templates típicos combinam:

| Combinação                              | Exemplo de templates                  |
| --------------------------------------- | ------------------------------------- |
| Full + Mobile-drawer                    | AdminLTE básico, Tabler               |
| Full + Mini-collapsed + Mobile-drawer   | Metronic, Sneat, Vuexy, Materio       |
| Full + Mobile-overlay                   | Templates muito antigos               |

## Detectando modos no CSS

Procurar regras do tipo:

```css
/* Mini-collapsed: classe no body ou aside */
.sidebar-collapsed .sidebar { width: 78px; }
.sidebar-collapsed .nav-link span { display: none; }

/* Mobile-drawer: media query + transform */
@media (max-width: 991.98px) {
  .sidebar { transform: translateX(-100%); }
  .sidebar.show { transform: translateX(0); }
  .sidebar-backdrop { display: block; }
}
```

Anotar:

- O **breakpoint** exato (`991.98px`, `767px`, `1024px`)
- A **classe-pivô** (`.sidebar-collapsed`, `.sidebar-mini`, `.show`, `.sidebar-open`) e onde ela é colocada (body, html, aside)
- Se há transform/transition envolvidos

## Implementação no `menu.component.tsx`

```tsx
"use client";

const [collapsed, setCollapsed] = useState(false);  // mini desktop
const [drawerOpen, setDrawerOpen] = useState(false); // mobile
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const mq = window.matchMedia('(max-width: 991.98px)');
  const update = () => setIsMobile(mq.matches);
  update();
  mq.addEventListener('change', update);
  return () => mq.removeEventListener('change', update);
}, []);

useEffect(() => {
  // ler localStorage só no client; nunca no useState initializer
  const saved = localStorage.getItem('adminMenu.collapsed');
  if (saved !== null) setCollapsed(saved === 'true');
}, []);

useEffect(() => {
  localStorage.setItem('adminMenu.collapsed', String(collapsed));
}, [collapsed]);

useEffect(() => {
  if (!drawerOpen) return;
  const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
  document.addEventListener('keydown', onKey);
  return () => document.removeEventListener('keydown', onKey);
}, [drawerOpen]);

const mode: 'full' | 'mini' | 'mobile' = isMobile ? 'mobile' : collapsed ? 'mini' : 'full';
```

Fechar drawer ao trocar de rota: usar `usePathname()` em `useEffect` que zera `drawerOpen` quando o pathname muda.

Persistência: SOMENTE se o original o fizer. Se não fizer, remover os dois effects de localStorage.
