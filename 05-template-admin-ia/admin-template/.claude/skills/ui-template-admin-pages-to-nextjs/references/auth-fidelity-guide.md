# Auth fidelity guide

Login é o **único cartão de visitas antes do shell aparecer**. Replicar com fidelidade visual máxima.

## Princípio

Login + Registro + Esqueci minha senha vivem na **mesma rota** com troca de modo via `searchParams`, compartilhando layout. Não duplicar ilustração/branding/copy.

## Estrutura de saída

```
src/app/(auth)/
├── layout.tsx                  # entry-point fino — importa AuthLayout do módulo
└── auth/
    └── page.tsx                # entry-point fino — importa AuthForm do módulo

src/modules/examples/auth/
├── auth-layout.tsx             # layout compartilhado (ilustração + slot)
├── auth-form.client.tsx        # alterna entre login | register | forgot | reset | verify
├── mock-data.ts                # botões sociais, copy, links
└── components/
    ├── login-fields.tsx
    ├── register-fields.tsx
    ├── forgot-fields.tsx
    └── illustration.tsx        # se houver ilustração lateral
```

Rotas:
- `/auth` → login (default)
- `/auth?mode=login`
- `/auth?mode=register`
- `/auth?mode=forgot`
- `/auth?mode=reset`
- `/auth?mode=verify`
- `/auth?mode=lock`

Apenas modos que o template demonstra são habilitados. O catálogo (`pages-catalog.md`) lista os adicionais.

## Protocolo de extração

### 1. Classificar o layout

Inspecionar o HTML de login do template e classificar em uma das categorias:

| Layout | Características | Como replicar |
|--------|-----------------|---------------|
| **centered card** | Card central com formulário, fundo simples ou com pattern | `<div className="min-h-screen flex items-center justify-center p-4">` com `<Card>` ao centro |
| **split com ilustração** | Lado esquerdo (ou direito) com ilustração/imagem, outro lado com formulário | `<div className="min-h-screen grid lg:grid-cols-2">` com ilustração em uma coluna e form na outra |
| **fullscreen brand** | Tela inteira com brand, formulário sobrepondo | `<div className="min-h-screen relative">` com background e form posicionado |
| **boxed light** | Card pequeno centralizado, fundo claro neutro | mesmo que centered card |
| **modern com gradiente** | Background com gradiente, card translúcido | replicar gradiente via classe Tailwind se já existe nos tokens; senão, simplificar para `bg-ui-background` |

### 2. Extrair elementos visuais

Tabela obrigatória, preenchida lendo o HTML:

| Elemento | Presente? | Detalhes extraídos |
|----------|-----------|-------------------|
| Logo | sim/não | path do SVG/PNG, posição (top/center) |
| Ilustração lateral | sim/não | path da imagem, posição (left/right), copy associada |
| Headline (h1) | sim/não | texto literal |
| Subhead (parágrafo curto) | sim/não | texto literal |
| Divisor "ou" entre social e form | sim/não | texto exato ("ou", "or", "OR continue with") |
| Botões sociais | sim/não | provedores (Google, Facebook, Apple, GitHub, Twitter), posição (acima/abaixo do form) |
| Campo email/usuário | sim/não | label, placeholder, tipo |
| Campo senha | sim/não | toggle mostrar/esconder? |
| Lembrar-me | sim/não | label exata |
| Link "Esqueci minha senha" | sim/não | label, posição |
| Botão de submit | sim/não | label exata, tamanho, full-width? |
| Link de troca de modo | sim/não | "Não tem conta? Cadastre-se" → label exata |
| Footer copy | sim/não | termos, política de privacidade, copyright |

### 3. Implementar `(auth)/layout.tsx`

O layout é **compartilhado** entre todos os modos. Não troca por modo (apenas o conteúdo do form muda). Se o template tem ilustrações distintas por modo (registro com ilustração diferente), é aceitável manter UMA ilustração e simplificar — comentar a decisão.

### 4. Implementar `auth-form.client.tsx`

```tsx
"use client";
import { useSearchParams } from "next/navigation";
// imports de primitivos: Input, Label, Button, Checkbox

type Mode = "login" | "register" | "forgot" | "reset" | "verify" | "lock";

export function AuthForm() {
  const params = useSearchParams();
  const mode = (params.get("mode") as Mode) ?? "login";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Apresentacional — sem auth real.
    console.info(`[demo] submit auth mode=${mode}`);
  };

  switch (mode) {
    case "register": return <RegisterFields onSubmit={handleSubmit} />;
    case "forgot":   return <ForgotFields onSubmit={handleSubmit} />;
    case "reset":    return <ResetFields onSubmit={handleSubmit} />;
    case "verify":   return <VerifyFields onSubmit={handleSubmit} />;
    case "lock":     return <LockFields onSubmit={handleSubmit} />;
    default:         return <LoginFields onSubmit={handleSubmit} />;
  }
}
```

Cada modo tem seu sub-componente local. Compartilham o estilo do form via primitivos.

### 5. Comportamentos

- **Toggle mostrar/esconder senha**: se o template tem, replicar usando state local (`useState`) + `<IconButton>`.
- **Validação**: NÃO implementar validação real. Atributos `required`, `type="email"`, `minLength` apenas. Sem zod, sem react-hook-form (a menos que já estejam disponíveis nos composites — caso em que usar a versão simples sem schema).
- **Auth real**: PROIBIDO. `onSubmit` apenas `preventDefault` + `console.info`/`toast`.
- **Redirect pós-submit**: opcional para demo — adicionar `router.push("/dashboard")` no submit do login com comentário "apenas para demo".

### 6. Comentário-cabeçalho obrigatório

```tsx
/**
 * Auth (login + registro + esqueci senha)
 *
 * Replica: <template-path>/auth-login-cover.html
 * Fidelidade: ALTA (pixel-a-pixel ao layout do template)
 * Layout: split com ilustração à esquerda
 * Modos: login, register, forgot
 * Adaptações: sem validação real, sem auth real, submit apenas console.info.
 */
```

### 7. Checklist de paridade visual

- [ ] Layout (centered/split/fullscreen) idêntico ao template
- [ ] Logo posicionado igual
- [ ] Ilustração presente quando o template tem
- [ ] Hierarquia de títulos (headline + subhead) replicada
- [ ] Divisor "ou" presente quando há
- [ ] Botões sociais nos provedores corretos e na posição correta
- [ ] Campos do formulário casam com o template
- [ ] Toggle mostrar/esconder senha quando o template tem
- [ ] Lembrar-me e "Esqueci minha senha" presentes quando o template tem
- [ ] Link de troca de modo (login ↔ registro) usando `Link` do Next com `?mode=...`
- [ ] Footer copy preservada
- [ ] Responsivo: layout split colapsa para coluna única em mobile

### 8. Idioma

- Se o template é em inglês: pt-BR para labels novos, mas preservar marketing copy do template em inglês quando característica do design.
- Se em pt-BR: tudo em pt-BR.
- Não traduzir nomes de provedores sociais ("Google", "Apple").
