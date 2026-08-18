Crie uma skill chamada `shared-validation-rule` dentro de `.agents/skills/shared-validation-rule` para criar regras de validação reutilizáveis dentro de `packages/shared/src/validation/rules`, seguindo exatamente o padrão estrutural, semântico e de testes já adotado no projeto.

No `SKILL.md`, defina:

- `name`: `shared-validation-rule`
- `description`: `Cria regras de validação reutilizáveis no pacote compartilhado da aplicação, seguindo o padrão existente de contratos, utilitários, códigos de erro, exports e testes unitários completos.`

Objetivo da skill:

- Criar novas regras de validação reutilizáveis dentro de `packages/shared`.
- Seguir exatamente o padrão já existente no projeto.
- Reaproveitar `rule.utils` sempre que fizer sentido.
- Criar testes unitários robustos para a nova regra.
- Garantir integração correta com os exports do pacote shared.
- Produzir uma regra simples, previsível, reutilizável e fácil de manter.

Referências obrigatórias que a skill deve ler antes de criar a nova regra:

1. `packages/shared/src/validation/validation-rule.interface.ts`
2. `packages/shared/src/validation/validation-field.interface.ts`
3. `packages/shared/src/validation/validator.ts`
4. `packages/shared/src/validation/rule.utils.ts`
5. `packages/shared/src/validation/index.ts`
6. `packages/shared/src/validation/rules/index.ts`
7. Regras de referência, no mínimo:
   - `packages/shared/src/validation/rules/required.rule.ts`
   - `packages/shared/src/validation/rules/email.rule.ts`
   - `packages/shared/src/validation/rules/min-length.rule.ts`
   - `packages/shared/src/validation/rules/range-length.rule.ts`
   - `packages/shared/src/validation/rules/strong-password.rule.ts`
   - `packages/shared/src/validation/rules/person-name.rule.ts`
8. Testes de referência, no mínimo:
   - `packages/shared/test/validation/rules/required.rule.test.ts`
   - `packages/shared/test/validation/rules/email.rule.test.ts`
   - `packages/shared/test/validation/rules/min-length.rule.test.ts`
   - `packages/shared/test/validation/rules/range-length.rule.test.ts`
   - `packages/shared/test/validation/rules/security-rules.test.ts`
   - `packages/shared/test/validation/rules/string-rules.test.ts`

Entradas obrigatórias da skill:

1. O nome da regra que deve ser criada.
2. O objetivo da validação.
3. O tipo principal de valor que a regra deve validar:
   - `string`
   - `number`
   - `date`
   - `array`
   - `mixed`
4. O código de erro esperado que a regra deve retornar quando falhar.

Entradas opcionais: 5. Parâmetros da regra, quando houver, como:

- mínimo
- máximo
- lista de valores
- regex
- configuração de comportamento

6. Exemplos de valores válidos e inválidos, quando o usuário quiser orientar melhor a implementação.
7. Se a regra deve ignorar valores vazios ou tratá-los como inválidos.

Objetivo funcional da skill:

- Criar um arquivo de regra em `packages/shared/src/validation/rules/`.
- Criar ou atualizar os exports necessários.
- Criar ou atualizar o teste correspondente em `packages/shared/test/validation/rules/`.
- Garantir que a nova regra funcione de forma coerente com `Validator.validate(...)` e com os códigos de erro esperados pelo projeto.

Regras da implementação:

1. A skill deve criar a regra no arquivo:
   - `packages/shared/src/validation/rules/<rule-name>.rule.ts`
2. O nome do arquivo deve ser sempre em `kebab-case`.
3. O nome da classe deve ser em PascalCase com sufixo `Rule`.
   - Exemplo: `EmailRule`, `MinLengthRule`, `StrongPasswordRule`
4. Toda regra deve implementar:
   - `ValidationRule`
5. O método da regra deve seguir o padrão:
   - `validate(value: unknown): string | null`
6. O retorno da regra deve ser:
   - `null` quando o valor for válido
   - um código curto de erro quando o valor for inválido
7. A skill deve seguir exatamente o padrão semântico já existente no projeto:
   - a regra só devolve o sufixo do erro
   - o `Validator` é quem monta o erro completo no formato `<field.code>.<errorCode>`
8. A skill não deve lançar exceção diretamente dentro da regra.
9. A skill não deve criar efeitos colaterais.
10. A skill deve priorizar reaproveitamento dos utilitários de `rule.utils.ts`.
11. Se a regra puder ser implementada com `validateStringValues`, `validateNumberValues`, `validateDateValues`, `validateEachValue`, `isEmptyValue`, `getValueLength`, `toValidDate` ou `testPattern`, ela deve reutilizar essas funções.
12. A skill não deve duplicar lógica utilitária que já exista em `rule.utils.ts`.
13. Se a nova regra exigir uma utilidade realmente genérica e reutilizável que ainda não exista, a skill pode propor e criar uma nova função em `rule.utils.ts`.
14. Essa nova função utilitária só deve ser criada se for claramente reutilizável por outras regras.
15. A skill deve manter a implementação da regra simples, curta e previsível.

Regras de comportamento: 16. A skill deve observar o padrão já existente sobre valores vazios. 17. Em geral, regras opcionais ignoram valores vazios e retornam `null`, deixando a obrigatoriedade para `RequiredRule`. 18. Se a nova regra precisar tratar vazio de outra forma, isso deve ser explícito e coerente com a intenção do usuário. 19. Quando a regra aceitar parâmetros, a skill deve criá-los por construtor, no mesmo padrão das regras existentes. 20. Quando a regra validar múltiplos valores ou coleções, a skill deve seguir o estilo já usado nas regras atuais. 21. A skill deve escolher nomes de erro consistentes com os padrões atuais, como:

- `required`
- `invalid.email`
- `min.length`
- `range.length`
- `strong.password`
- `person.name`

Regras de integração: 22. A skill deve atualizar:

- `packages/shared/src/validation/rules/index.ts`

23. Se necessário, a skill deve garantir que a regra continue acessível pelos exports agregados de:

- `packages/shared/src/validation/index.ts`
- `packages/shared/src/index.ts`

24. A skill deve preservar exports existentes e adicionar apenas o necessário.

Regras para os testes: 25. A skill deve criar ou atualizar o teste da regra em:

- `packages/shared/test/validation/rules/<rule-name>.rule.test.ts`

26. O teste deve seguir o padrão já existente no projeto.
27. Os testes devem cobrir 100% da nova regra criada.
28. Os testes devem incluir, no mínimo:

- cenário válido
- cenário inválido
- comportamento com valores vazios, quando aplicável
- comportamento com tipos inválidos, quando aplicável
- comportamento dos parâmetros da regra, quando existirem
- cenários limite relevantes

29. Se a regra reutilizar utilitário com branch relevante, os testes da própria regra devem cobrir o comportamento observável da regra, sem duplicar teste do utilitário além do necessário.
30. A skill deve preferir testes curtos, claros e orientados ao contrato da regra.
31. Ao final, a skill deve rodar os testes relevantes do pacote shared e verificar cobertura.
32. Se a cobertura da nova regra não atingir 100%, a skill deve complementar os testes até atingir esse objetivo.

Few-shots obrigatórios dentro da própria skill: 33. A skill deve incluir few-shots internos mostrando o padrão real de implementação e teste de regras do projeto. 34. Esses few-shots devem ficar dentro da própria pasta `.agents/skills/shared-validation-rule`. 35. Os few-shots devem mostrar, no mínimo:

- uma regra sem parâmetros, como `RequiredRule`
- uma regra com validação de string, como `EmailRule`
- uma regra com parâmetro simples, como `MinLengthRule`
- uma regra com dois parâmetros, como `RangeLengthRule`
- uma regra que reutiliza helper genérico, como `StrongPasswordRule` ou `PersonNameRule`

36. Esses few-shots devem servir como referência prática de implementação e teste.
37. Os few-shots não devem depender de arquivos externos à própria skill para cumprir seu papel didático.

Exemplos de padrão que a skill deve reproduzir:

Few-shot 1, regra simples:

```ts
import { ValidationRule } from "../validation-rule.interface";
import { isEmptyValue } from "../rule.utils";

export class RequiredRule implements ValidationRule {
  validate(value: unknown): string | null {
    return isEmptyValue(value) ? "required" : null;
  }
}
```

Few-shot 2, regra com string e vazio opcional:

```ts
import { isEmptyValue } from "../rule.utils";
import { ValidationRule } from "../validation-rule.interface";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class EmailRule implements ValidationRule {
  validate(value: unknown): string | null {
    if (isEmptyValue(value)) {
      return null;
    }

    if (typeof value !== "string") {
      return "invalid.email";
    }

    return EMAIL_REGEX.test(value.trim()) ? null : "invalid.email";
  }
}
```

Few-shot 3, regra parametrizada:

```ts
import { getValueLength, isEmptyValue } from "../rule.utils";
import { ValidationRule } from "../validation-rule.interface";

export class MinLengthRule implements ValidationRule {
  constructor(readonly min: number) {}

  validate(value: unknown): string | null {
    if (isEmptyValue(value)) {
      return null;
    }

    const length = getValueLength(value);

    return length !== null && length >= this.min ? null : "min.length";
  }
}
```

Few-shot 4, teste curto e direto:

```ts
import { MinLengthRule } from "../../../src/index";

describe("MinLengthRule", () => {
  test("deve validar o tamanho minimo de strings", () => {
    const rule = new MinLengthRule(3);

    expect(rule.validate("ab")).toBe("min.length");
    expect(rule.validate("abc")).toBeNull();
  });
});
```

Determinismo e estrutura da skill: 38. A skill deve ser determinística na estrutura, nos nomes e nos arquivos que cria. 39. Tudo que a skill precisa para funcionar deve estar contido dentro de .agents/skills/shared-validation-rule. 40. Se fizer sentido para completar a skill, crie também agents/openai.yaml coerente com o nome e a descrição definidos no SKILL.md.

Importante:

A skill não cria entidades, casos de uso ou controllers.
A skill existe para criar regras reutilizáveis no pacote shared.
A skill deve seguir estritamente o padrão já existente nas regras do projeto.
A skill deve preferir reaproveitar utilitários antes de criar novos.
A skill deve criar testes junto com a regra.
A cobertura esperada para a nova regra deve ser 100%.
