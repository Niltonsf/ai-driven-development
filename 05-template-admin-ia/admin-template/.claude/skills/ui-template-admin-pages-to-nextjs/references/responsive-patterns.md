# Responsive patterns

Replicar comportamento responsivo do template, não opinar.

## Mapeamento Bootstrap → Tailwind

Templates baseados em Bootstrap usam um grid de 12 colunas em breakpoints `sm/md/lg/xl/xxl`. Tailwind tem `sm/md/lg/xl/2xl`.

| Bootstrap | Tailwind | Aproximação |
|-----------|----------|-------------|
| `col-12` | (default block) | full width |
| `col-md-6` | `md:col-span-1` em `md:grid-cols-2` | metade |
| `col-md-4` | `lg:col-span-1` em `lg:grid-cols-3` | terço |
| `col-md-8` | `lg:col-span-2` em `lg:grid-cols-3` | dois terços |
| `col-lg-3` | `xl:col-span-1` em `xl:grid-cols-4` | quarto |
| `col-md-6 col-lg-4` | `sm:col-span-1 lg:col-span-1` em `sm:grid-cols-2 lg:grid-cols-3` | |

## Breakpoints comuns

| Tailwind | px | Uso típico |
|----------|----|------------|
| (default) | <640 | mobile portrait |
| `sm:` | ≥640 | mobile landscape / tablet portrait |
| `md:` | ≥768 | tablet |
| `lg:` | ≥1024 | desktop pequeno |
| `xl:` | ≥1280 | desktop |
| `2xl:` | ≥1536 | desktop grande |

## Padrões por arquétipo

### Dashboard
```tsx
// stat cards: 1 col mobile, 2 tablet, 4 desktop
<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

// linha mista: stack mobile, lado-a-lado desktop
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

// tabela full-width, scroll horizontal interno em mobile (vem do composite)
<DataTable ... />
```

### Lista CRUD
```tsx
// toolbar: stack mobile, inline desktop (vem do composite, mas a página pode controlar)
<DataTableToolbar />

// paginação centrada em mobile, dividida em desktop
<Pagination />
```

### Detalhe
```tsx
// sidebar 280px desktop, stacked mobile
<div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

// abas: scroll horizontal mobile, lado-a-lado desktop (composite)
<Tabs />
```

### Auth — split
```tsx
// ilustração esconde em mobile
<div className="min-h-screen lg:grid lg:grid-cols-2">
  <aside className="hidden lg:flex lg:flex-col lg:justify-center bg-...">
    <Illustration />
  </aside>
  <main className="flex items-center justify-center p-6 lg:p-12">
    <div className="w-full max-w-md">
      <AuthForm />
    </div>
  </main>
</div>
```

### Auth — centered
```tsx
<div className="min-h-screen flex items-center justify-center p-4 bg-...">
  <Card className="w-full max-w-md">
    <AuthForm />
  </Card>
</div>
```

### 404 / 500
```tsx
<div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
  <Illustration className="max-w-md" />
  <h1>...</h1>
  <p>...</p>
  <Button>Voltar para o início</Button>
</div>
```

## Quando o template tem mobile-specific behavior

- Sidebar colapsa em drawer: já tratado pelo shell.
- Tabela vira card-list em mobile: a versão atual do `DataTable` (composite) já trata via scroll horizontal — não recriar.
- Filtros viram drawer em mobile: usar o `Drawer` composite quando disponível; caso contrário, manter empilhamento simples.

## Não inventar breakpoints

Se o template usa 4 breakpoints, usar 4. Não adicionar `2xl:` se o template para em `xl:`.
