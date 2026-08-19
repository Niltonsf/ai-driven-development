# Mock data patterns

Mocks são **determinísticos**, **tipados**, **sem libs**, e moram em `src/modules/examples/<feature>/mock-data.ts` — **nunca** em `src/shared/` e **nunca** em `src/app/`.

## Princípios

1. **Sem `Math.random()`**, sem `faker`, sem `chance`. Dados escritos manualmente.
2. **Tipo explícito** sempre exportado junto com o array.
3. **Volume realista** (tabela abaixo).
4. **Cobertura de estados variados** — para que badges, cores e variantes apareçam todos.
5. **pt-BR por padrão**; idioma do template em páginas com copy específica.
6. **Formato BR**: datas `DD/MM/YYYY` ou ISO com formatação no render; valores monetários `R$ 1.234,56`; percentuais `+12,5%` / `-3,2%`.

## Volumes mínimos

| Tipo | Volume |
|------|--------|
| Lista paginada (tabela CRUD) | 25-30 itens |
| Lista de atividade recente | 8-12 itens |
| Lista de notificações | 6-10 itens |
| Série temporal (linha/área) | 12 pontos (12 meses) ou 30 pontos (30 dias) |
| Barras agrupadas | 6-12 categorias |
| Pizza/donut | 4-6 fatias |
| Stat cards (linha) | 4 cards |
| Sparkline | 7-12 pontos |
| Tabela embedada no dashboard | 5-8 linhas |
| Comentários / mensagens | 4-8 itens |
| Files / arquivos | 8-15 itens |

## Bancos de nomes pt-BR (para reuso)

```ts
const NOMES_PROPRIOS = [
  "Ana Beatriz Lima", "Carlos Eduardo Souza", "Mariana Ferreira", "João Pedro Almeida",
  "Larissa Costa", "Rafael Mendes", "Beatriz Carvalho", "Lucas Oliveira",
  "Camila Ribeiro", "Pedro Henrique Silva", "Isabela Martins", "Gustavo Rocha",
  "Fernanda Pereira", "Bruno Cardoso", "Juliana Barbosa", "Diego Nunes",
  "Patrícia Araújo", "Felipe Gomes", "Vanessa Dias", "Rodrigo Pinto",
  "Amanda Teixeira", "Thiago Cavalcanti", "Renata Moreira", "André Ramos",
  "Letícia Vieira", "Marcos Antônio Reis", "Cristina Borges", "Vinícius Castro",
  "Aline Fonseca", "Henrique Monteiro"
];

const EMAILS = NOMES_PROPRIOS.map(
  (n) => n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .split(" ").slice(0, 2).join(".") + "@exemplo.com.br"
);

const ROLES = ["Administrador", "Editor", "Visualizador", "Gerente", "Suporte"];
const STATUS = ["Ativo", "Inativo", "Pendente", "Suspenso"];
```

## Cobertura de estados — exemplo (lista de usuários)

Garantir que entre as ~25 linhas haja pelo menos:
- 60% Ativo, 20% Inativo, 15% Pendente, 5% Suspenso
- 3-4 roles diferentes representadas
- Datas espalhadas (alguns recentes, alguns antigos)

## Tipos exemplares

```ts
// src/modules/examples/users/mock-data.ts
export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: "Administrador" | "Editor" | "Visualizador" | "Gerente" | "Suporte";
  status: "Ativo" | "Inativo" | "Pendente" | "Suspenso";
  createdAt: string;     // ISO
  lastLoginAt: string;   // ISO
};

export const users: User[] = [
  { id: "u-001", name: "Ana Beatriz Lima", email: "ana.beatriz@exemplo.com.br",
    avatarUrl: null, role: "Administrador", status: "Ativo",
    createdAt: "2024-01-15T10:00:00Z", lastLoginAt: "2026-05-08T14:30:00Z" },
  // ...
];
```

## Séries temporais

```ts
export const monthlyRevenue: { month: string; value: number }[] = [
  { month: "Jan", value: 42_300 },
  { month: "Fev", value: 38_900 },
  { month: "Mar", value: 51_200 },
  // ... 12 pontos
];
```

## Avatar URLs

Para evitar dependências externas: `avatarUrl: null` e deixar o `<Avatar>` renderizar iniciais. Se o template usa fotos, usar `https://i.pravatar.cc/150?img=N` (1-70) com comentário "placeholder de demonstração".

## Datas determinísticas

Não usar `new Date()` em runtime. Datas literais como string ISO. Para "tempo relativo" no display, fazer o cálculo no client component a partir da string.

## Idioma e formatação no render

Mock guarda valores **canônicos** (ISO, número puro). Formatação BR fica no componente:

```ts
// no render
new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
new Intl.DateTimeFormat("pt-BR").format(new Date(isoString));
```

Não pré-formatar no mock.
