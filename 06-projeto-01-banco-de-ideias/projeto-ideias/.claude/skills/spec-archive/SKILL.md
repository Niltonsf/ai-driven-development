---
name: spec-archive
description: Arquiva uma especificacao concluida deste projeto movendo a pasta da spec de `.specs/changes/<NNN-slug>` para `.specs/archive/`, trocando o numero sequencial inicial pelo timestamp do arquivamento (YYYYMMDDHHMMSS). Use esta skill sempre que o usuario pedir para arquivar, encerrar, finalizar, mover para archive ou "guardar" uma spec/change concluido (ex.: "arquive a spec 006", "mova 003-login-usuario para o archive", "essa change ja foi entregue, pode arquivar"), mesmo que ele nao diga a palavra "skill". A skill nunca altera o conteudo da spec e exige confirmacao explicita do usuario antes de arquivar uma spec que nao tenha evidencia de execucao.
---

# Spec Archive

Move uma especificacao concluida de `.specs/changes/` para `.specs/archive/`, renomeando a pasta: o numero sequencial inicial (`006`, `003`, ...) e substituido pelo timestamp do arquivamento no formato `YYYYMMDDHHMMSS` (ano, mes, dia, hora, minuto, segundo). O `slug` da spec e preservado.

Exemplo: `006-carregar-tipos-padrao` arquivado em 18/05/2026 13:30:45 vira `.specs/archive/20260518133045-carregar-tipos-padrao/`.

Sempre use o script `scripts/archive-spec.js`. Ele resolve a pasta da spec, calcula o timestamp, analisa evidencias e faz a movimentacao de forma deterministica e atomica. Nao mova pastas na mao nem reimplemente a logica.

## Principios inegociaveis

- **Nao modificar a spec.** O conteudo de `spec.md` e de qualquer arquivo dentro da pasta da spec nao pode ser alterado. A skill so move a pasta e renomeia o diretorio.
- **Mover a pasta inteira.** Uma spec pode ter arquivos alem de `spec.md` (constantes, anexos). Tudo vai junto.
- **Nunca sobrescrever.** Se o destino ja existir, pare e reporte; nao apague nem mescle.
- **Confirmar quando nao houver evidencia de execucao.** Esse e o guardrail central — ver abaixo.

## O que conta como evidencia de execucao

Neste projeto (ver `.specs/shared/como-executar.md`), uma task concluida fica marcada `- [x]` com uma linha de evidencia logo abaixo no formato `> ✅ YYYY-MM-DD HH:MM — ...`.

O script considera que ha evidencia quando existe **pelo menos uma** task marcada `[x]` **ou pelo menos uma** linha com `✅`. Uma spec sem nenhuma task marcada e sem nenhuma linha `✅` e tratada como **sem evidencia de execucao** — provavelmente ainda nao foi executada, e arquiva-la pode ser um engano.

## Fluxo

1. Identifique no pedido qual spec arquivar (numero, nome da pasta ou caminho). Se o usuario passou so o numero (`006`) ou o nome (`006-carregar-tipos-padrao`), isso basta — o script resolve em `.specs/changes/`.

2. Rode a **inspecao** (sem `--apply`) a partir da raiz do projeto:

```bash
node "$(find . -maxdepth 6 -path "*/spec-archive/scripts/archive-spec.js" ! -path "*/node_modules/*" | head -1)" --spec 006-carregar-tipos-padrao
```

   O script imprime um JSON com `destDir` previsto e `evidence` (`checkedTasks`, `uncheckedTasks`, `evidenceLines`, `hasEvidence`, `complete`).

3. Decida com base em `evidence.hasEvidence`:

   - **`hasEvidence: true`** → pode arquivar direto. Rode com `--apply`:

     ```bash
     node "$(find . -maxdepth 6 -path "*/spec-archive/scripts/archive-spec.js" ! -path "*/node_modules/*" | head -1)" --spec 006-carregar-tipos-padrao --apply
     ```

   - **`hasEvidence: false`** → **NAO arquive ainda.** Pergunte ao usuario, de forma explicita, se ele realmente quer arquivar uma spec que nao tem nenhuma evidencia de execucao (cite que nao ha tasks `[x]` nem linhas `✅`, e que isso normalmente indica que a spec nao foi executada). So depois de confirmacao clara, reexecute com `--apply --force`:

     ```bash
     node "$(find . -maxdepth 6 -path "*/spec-archive/scripts/archive-spec.js" ! -path "*/node_modules/*" | head -1)" --spec 006-carregar-tipos-padrao --apply --force
     ```

     Se o usuario nao confirmar, nao mova nada e explique que a spec permaneceu em `changes/`.

4. Confirme o resultado: a saida deve ter `status: "archived"` com `to` apontando para `.specs/archive/<timestamp>-slug`. Reporte ao usuario o nome novo e o caminho.

## Interpretacao do status do script

- `status: "inspect"` — apenas leitura; nada foi movido.
- `status: "archived"` — pasta movida e renomeada com sucesso (`from` → `to`).
- `status: "needs_confirmation"` — `--apply` foi chamado sem evidencia e sem `--force`; nada foi movido. Volte ao passo 3 e obtenha a confirmacao do usuario.
- `status: "error"`, `reason: "destination_exists"` — ja existe uma pasta com esse nome no archive; nada foi movido. Investigue antes de qualquer acao destrutiva.
- `status: "error"` (outros) — pedido invalido (ex.: spec nao encontrada, `--spec` ausente). Ajuste e tente de novo.

## Observacoes

- `complete` (todas as tasks `[x]` e nenhuma `[ ]`) e apenas informativo. O guardrail obrigatorio e so sobre **ausencia total** de evidencia. Uma spec parcialmente executada tem evidencia e pode ser arquivada sem `--force` — mas vale mencionar ao usuario quando ainda houver tasks abertas, caso ele queira reconsiderar.
- `--timestamp YYYYMMDDHHMMSS` existe para arquivamentos deterministicos/testes; em uso normal, deixe o script calcular a hora atual.
- O script nao usa dependencias externas (apenas `node:fs`/`node:path`); roda com o Node do projeto.

## Restricoes

- Nao editar, reformatar ou "limpar" a spec antes ou depois de mover.
- Nao mover specs para fora de `.specs/archive`.
- Nao arquivar sem evidencia sem confirmacao explicita do usuario.
- Nao sobrescrever destino existente.
- Nao criar documentacao extra fora dos recursos desta skill.
