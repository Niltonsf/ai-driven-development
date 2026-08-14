Eu quero que você crie novas regras dentro da pasta (packages/shared/src/validation/rules/index.ts). E as novas regras estarão definidas abaixo. Não gerar nenhuma alteração extra no projeto; apenas criar as regras dentro dessa pasta.

Regras que envolvam múltiplos valores podem ser passadas como um array. Por exemplo, regras de match, um array de duas posições, e a regra vai comparar o primeiro com o segundo, por exemplo. Então, regras de múltiplos valores ali são suportadas pela API, se você passar, por exemplo, um array com os múltiplos valores para serem processados dentro da regra.

Gere os testes unitários para cada uma das regras e mantenha a cobertura de 100%.

## String/Texto
|Regra|Descrição|
| `TrimRule` | Rejeita strings com espaços no início/fim |
| `NoWhitespaceRule` | Proíbe qualquer espaço em branco |
| `AlphaRule` | Apenas letras (a-z, A-Z) |
| `AlphaNumericRule` | Apenas letras e números |
| `StartsWithRule` | Deve começar com prefixo específico |
| `EndsWithRule` | Deve terminar com sufixo específico |
| `ContainsRule` | Deve conter substring |
| `RegexRule` | Valida contra expressão regular customizada |
| `UpperCaseRule` | Apenas letras maiúsculas |
| `LowerCaseRule` | Apenas letras minúsculas |

## Numérico
|Regra|Descrição|
| `MaxValueRule` | Valor máximo numérico |
| `RangeValueRule` | Entre min e max |
| `IntegerRule` | Apenas inteiros (sem decimais) |
| `PositiveRule` | Deve ser maior que zero |
| `NegativeRule` | Deve ser menor que zero |
| `PrecisionRule` | Máximo de casas decimais |

## Data e Hora
|Regra|Descrição|
| `DateStringRule` | String no formato ISO 8601 |
| `MinDateRule` | Data mínima permitida |
| `MaxDateRule` | Data máxima permitida |
| `DateRangeRule` | Entre duas datas |
| `FutureDateRule` | Deve ser uma data futura |
| `PastDateRule` | Deve ser uma data passada |
| `TimeStringRule` | Valida formato de hora (HH:mm, HH:mm:ss) |

## Identificadores e Formato
|Regra|Descrição|
| `UuidRule` | UUID v4 válido |
| `SlugRule` | Formato slug (`meu-texto-aqui`) |
| `HexColorRule` | Cor hexadecimal (`#FFF`, `#FFFFFF`) |
| `JsonStringRule` | String JSON parseável |

## Contato e Comunicação
|Regra|Descrição|
| `UrlRule` | URL válida (http/https) |
| `PhoneRule` | Número de telefone (E.164 ou custom) |
| `DomainRule` | Domínio válido (sem protocolo) |

## Segurança / Senha
|Regra|Descrição|
| `StrongPasswordRule` | Maiúscula + minúscula + número + especial + tamanho |
| `NoCommonPasswordRule` | Bloqueia senhas da lista negra (ex: "123456") |
| `NoRepeatCharsRule` | Sem caracteres repetidos consecutivos (ex: "aaa") |
| `HasUpperCaseRule` | Pelo menos uma maiúscula |
| `HasLowerCaseRule` | Pelo menos uma minúscula |
| `HasNumberRule` | Pelo menos um número |
| `HasSpecialCharRule` | Pelo menos um caractere especial |

## Brasil (contexto local)
|Regra|Descrição|
| `CpfRule` | CPF válido (com dígito verificador) |
| `CnpjRule` | CNPJ válido |
| `CepRule` | CEP no formato `00000-000` |
| `PhoneBrRule` | Telefone no padrão brasileiro |
| `RgRule` | RG (formato básico) |

## Arrays e Coleções
|Regra|Descrição|
| `MinItemsRule` | Mínimo de itens no array |
| `MaxItemsRule` | Máximo de itens no array |
| `UniqueItemsRule` | Sem itens duplicados |
| `InRule` | Valor deve estar numa lista permitida |
| `NotInRule` | Valor não pode estar numa lista negra |

## Lógica / Composição
|Regra|Descrição|
| `NotNullRule` | Proíbe `null` explicitamente |
| `NotUndefinedRule` | Proíbe `undefined` |
| `EqualsRule` | Valor deve ser igual a outro valor fixo |
| `NotEqualsRule` | Valor não pode ser igual a um valor fixo |