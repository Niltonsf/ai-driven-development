Cada regra precisa estar em um arquivo específico, deve implementar especificamente a validation rule conforme os exemplos abaixo.  Ou seja, todos os arquivos ficarão dentro da pasta do módulo compartilhado, src validation rules. Cada arquivo seguindo o mesmo padrão de nomenclatura: o nome da regra, se tiver um nome composto separado por hífens, em letras minúsculas com o final rule.ts. Eles devem implementar a interface validation rule e o arquivo index da pasta rules vai ter apenas o export de cada um das regras e não vai ter nenhuma constante, nenhuma variável, nada, especificamente dentro desse arquivo.

Exemplos:
Arquivo packages/shared/src/validation/rules/age.rule.ts com export class AgeRule implements ValidationRule { ... }
Arquivo packages/shared/src/validation/rules/date.rule.ts com export class DateRule implements ValidationRule { ... }
Arquivo packages/shared/src/validation/rules/email.rule.ts com export class EmailRule implements ValidationRule { ... }

Funções utilitárias devem ser colocadas aqui: packages/shared/src/validation/rule.utils.ts
OBS: Evitar colocar funções específicas nesse arquivo, apenas funções usadas em múltiplas regras (rules)