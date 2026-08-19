---
name: ui-template-admin-all-to-nextjs
description: Esteira orquestradora que porta um template admin HTML/CSS/JS estático para um projeto Next.js (App Router) já existente, executando em ordem fixa as 7 skills da família `ui-template-admin-*` (shell, sidebar, primitives, composites, topbar, charts, pages). Cada fase roda em um subagente isolado para manter o contexto do orquestrador enxuto. Para na primeira falha. Dispara quando o usuário pede "rodar a esteira inteira", "portar template admin completo", "faz tudo" ou equivalente.
when_to_use: O usuário tem (1) uma pasta com template admin estático e (2) um projeto Next.js App Router já inicializado, e quer executar as 7 skills da família em sequência única, sem disparar cada uma manualmente.
---

# ui-template-admin-all-to-nextjs

**Camada:** Orquestração pura via subagentes. Esta skill não gera código, não lê SKILL.md das filhas, não toma decisões de design. Sua única função é despachar cada uma das 7 skills filhas em um subagente isolado, em ordem fixa, parando na primeira falha.

## Regra única de execução

Para cada skill filha da lista abaixo, nesta ordem exata:

1. **Despachar em um subagente** via Task tool, passando: nome da skill, `templatePath`, `projectPath`.
2. **Aguardar o retorno estruturado** do subagente (formato definido em "Contrato do subagente").
3. **Se status = OK** → registrar e prosseguir imediatamente para a próxima skill, sem perguntar nada ao usuário.
4. **Se status = FAIL** → parar a esteira, reportar a falha e encerrar.

Quando todas as 7 retornarem OK, emitir o relatório final.

## Lista ordenada (imutável)

1. `ui-template-admin-shell-to-nextjs`
2. `ui-template-admin-sidebar-to-nextjs`
3. `ui-template-admin-primitives-to-nextjs`
4. `ui-template-admin-composites-to-nextjs`
5. `ui-template-admin-topbar-to-nextjs`
6. `ui-template-admin-charts-to-nextjs`
7. `ui-template-admin-pages-to-nextjs`

Não reordenar. Não paralelizar. Não pular.

## Inputs

| Nome           | Obrigatório | Descrição                                                     |
| -------------- | ----------- | ------------------------------------------------------------- |
| `templatePath` | sim         | Pasta do template admin estático (com `index.html` e assets). |
| `projectPath`  | sim         | Raiz do projeto Next.js App Router de destino.                |
| `siteName`     | opcional    | Identificador curto do template para logs.                    |

Se faltarem `templatePath` ou `projectPath`, tentar inferir do cwd. Só abortar se for genuinamente impossível.

## Pré-condições (Fase 0)

Antes de despachar a primeira skill, verificar — diretamente, sem subagente, pois é trivial:

- `templatePath` existe e contém ao menos um `.html` e uma pasta de CSS.
- `projectPath` tem `package.json` com `next` em dependências e pasta `src/app/`.

Falha aqui ⇒ abortar antes de começar a esteira.

## Contrato do subagente

Cada subagente recebe um prompt do tipo:

> Execute integralmente a skill `<nome>` com `templatePath=<...>` e `projectPath=<...>`. Siga o SKILL.md dela na íntegra, incluindo seus `steps/` e o gate de aceite final. Ao terminar, retorne **apenas** um JSON com este formato e nada mais:
>
> ```json
> {
>   "skill": "<nome>",
>   "status": "OK" | "FAIL",
>   "summary": "<uma linha descrevendo o que foi feito ou onde falhou>",
>   "touchedPaths": ["<caminho1>", "<caminho2>"],
>   "failurePhase": "<fase interna se FAIL, senão null>",
>   "failureMessage": "<mensagem do gate se FAIL, senão null>"
> }
> ```

O orquestrador consome só esse JSON. Tudo o que o subagente leu, escreveu, raciocinou ou tentou fica no contexto descartado dele e nunca chega ao orquestrador.

## Execução autônoma

- Nenhuma pergunta ao usuário entre fases.
- Nenhum "posso continuar?", "sigo para a próxima?", "está OK assim?".
- Decisões ambíguas dentro de uma skill filha são problema da skill filha — ela tem critérios próprios.
- Única interrupção legítima: `status = FAIL` em alguma fase, ou pré-condição falha na Fase 0.

## Política de erro

Em qualquer `FAIL`:

1. Parar imediatamente. Não despachar a próxima.
2. Reportar: nome da skill, `failurePhase`, `failureMessage`, `touchedPaths` (para o usuário saber o que ficou parcial).
3. Sugerir `git status` e encerrar.

## Relatório final (apenas se as 7 retornarem OK)

Tabela de uma linha por skill: nome, status, `summary`. Encerrar com "Esteira concluída".

## O que esta skill NÃO faz

- Não inicializa o projeto Next.js.
- Não lê os SKILL.md das filhas (isso é trabalho do subagente).
- Não duplica nem reinterpreta instruções das filhas.
- Não decide nada de design.
- Não faz fallback, retry ou skip em caso de falha.

## Acceptance criteria

- [ ] Pré-condições verificadas na Fase 0.
- [ ] Cada uma das 7 skills foi despachada em subagente próprio, em ordem.
- [ ] Cada subagente retornou JSON no formato do contrato.
- [ ] Nenhuma fase foi pulada, reordenada ou substituída.
- [ ] Nenhuma pergunta foi feita ao usuário durante a execução.
- [ ] Em caso de FAIL, a esteira parou imediatamente e nenhuma skill posterior foi despachada.
