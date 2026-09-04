## Context

O cadastro de Conta já teve sua camada de negócio especificada e implementada (`modules/contas/src/conta`), e a capability `modulo-negocio-conta` registrou o padrão a ser reutilizado nos próximos cadastros. O cadastro de Cartão (`modules/cartao`) ainda é só scaffold; esta mudança escreve a especificação do seu núcleo de negócio aplicando aquele padrão.

A spec resultante será a referência usada ao implementar a camada de negócio de Cartão. As decisões abaixo registram **o que reaproveitar de Conta** e **o que muda por ser cartão** (atributos numéricos, bandeira, dígitos). Restrição central, herdada da spec de referência: a spec deve soar como escrita à mão por um dev experiente — passos no nível de contrato e regra, sem reproduzir o código linha a linha.

## Goals / Non-Goals

**Goals:**
- Aplicar o padrão da camada de negócio (model, dto, provider, use-case) já validado em Conta ao cadastro de Cartão.
- Definir fielmente as regras de Cartão: VOs textuais e seus limites, VOs numéricos reutilizados (`DayOfMonth` para dias, `NonNegative` para limite), padrão `create`/`tryCreate`, default `active = true`, unicidade de nome e os dois casos de uso (salvar e excluir).
- Deixar explícito o isolamento de dependências (só `@arquitetura/shared` e o próprio agregado).

**Non-Goals:**
- Especificar backend (Prisma/API), frontend ou configuração de módulo — apenas referenciados como fronteiras.
- Definir testes, seeds ou contratos HTTP.
- Prescrever assinaturas exatas de métodos de `@arquitetura/shared` (são contratos, não detalhes a copiar).
- Reescrever ou alterar a capability `modulo-negocio-conta`.

## Decisions

- **Reutilizar o padrão de Conta como molde, sem extrair um `modulo-negocio-base`.** A spec de Cartão é a primeira reutilização real do padrão. Mantemos uma capability concreta (`modulo-negocio-cartao`) ancorada nos valores de Cartão; a extração de um molde abstrato comum continua adiada (Open Question da spec de Conta) até termos evidência suficiente do que é realmente comum. Alternativa descartada: generalizar agora — prematuro com apenas dois cadastros.
- **Atributos numéricos reutilizam VOs compartilhados em vez de novos VOs de cartão.** `closingDay` e `dueDay` usam `DayOfMonth` (1–31, inteiro), e `limit` usa `NonNegative`. São regras genéricas já cobertas por `@arquitetura/shared`; criar VOs próprios duplicaria validação. Alternativa descartada: `DiaFechamentoCartao`/`LimiteCartao` próprios — sem regra específica que justifique.
- **Atributos textuais com regra própria viram VOs `Text` de Cartão.** `NomeCartao`, `DescricaoCartao`, `BandeiraCartao`, `UltimosDigitosCartao` e `IconeCartao` declaram limites e códigos de erro com prefixo do atributo. A cor reutiliza `HexColor`. Mesma decisão de Conta: os limites e códigos entram como **dados** na spec, por serem a parte mais fácil de errar ao replicar.
- **Spec descreve contratos e regras, não implementação.** Cada requisito cita o quê e o porquê, sem reproduzir corpo de função — igual à spec de Conta.
- **Casos de uso documentados por fluxo numerado + cenários WHEN/THEN.** Salvar unifica criação/atualização com unicidade de nome (`CARTAO_NAME_ALREADY_IN_USE`); Excluir valida existência (`CARTAO_NOT_FOUND`). Os cenários tornam cada regra testável, incluindo caminhos de falha.

## Risks / Trade-offs

- [Copiar literalmente a spec de Conta trocando só os nomes pode esconder regras específicas de cartão] → Os requisitos separam o padrão (texto normativo) dos dados de Cartão (limites/códigos/atributos numéricos); a revisão deve conferir os dados, não só a estrutura.
- [Engenharia do padrão pode divergir do código de Conta se este mudar] → A spec registra a fonte do padrão (`modulo-negocio-conta` e `modules/contas/src/conta`); divergência se resolve revisando a spec.
- [`DayOfMonth`/`NonNegative` têm contratos próprios de erro que diferem do padrão `Text`] → A spec documenta esses VOs por papel e faixa de validação, sem fixar seus códigos de erro internos, deixando claro que validação e mensagens vêm do VO compartilhado.

## Migration Plan

Não se aplica — artefato de especificação, sem deploy nem rollback. O "rollback" é descartar o diretório da mudança. A implementação posterior em `modules/cartao` seguirá as skills do projeto, com a spec como contrato.

## Open Questions

- Permanece a pergunta da spec de Conta: com dois cadastros especificados, já vale extrair um `modulo-negocio-base` com o padrão comum, deixando as specs por cadastro só com os dados específicos? Reavaliar após implementar Cartão.
