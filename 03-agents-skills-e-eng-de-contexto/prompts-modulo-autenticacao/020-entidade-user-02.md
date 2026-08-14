import {
  BcryptHashRule,
  EmailRule,
  Entity,
  EntityState,
  MaxLengthRule,
  MinLengthRule,
  PersonNameRule,
  RequiredRule,
  Validator,
} from "@poupig/shared";

export interface UserState extends EntityState {
  name: string;
  email: string;
  password: string;
}

export class User extends Entity<UserState> {
  constructor(props: UserState) {
    super(props);
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get password(): string {
    return this.props.password;
  }

  public validate(): void {
    Validator.validate([
      {
        code: "user.name",
        value: this.name,
        rules: [
          new RequiredRule(),
          new MinLengthRule(3),
          new MaxLengthRule(80),
          new PersonNameRule(),
        ],
      },
      {
        code: "user.email",
        value: this.email,
        rules: [new RequiredRule(), new EmailRule()],
      },
      {
        code: "user.password",
        value: this.password,
        rules: [new BcryptHashRule()],
      },
    ]);
  }
}

Pasta das regras: packages/shared/src/validation/rules

Eu quero que você crie uma regra chamada PersonNameRule, que vai usar a expressão regular que foi colocada dentro de UserEntity, mas eu não quero que essa regra esteja dentro de usuário e eu quero que essa regra seja uma regra dentro do projeto compartilhado para que eu possa usar essa regra em outros cenários que precisam validar o nome de uma pessoa. O nome de uma pessoa precisa ter no mínimo dois nomes, o nome e o sobrenome. A questão dos espaços em branco, eles podem ser ignorados ali se tiver mais de um espaço em branco e tal, mas o importante tem que ter no mínimo dois nomes e tem que seguir uma regra de caracteres que façam sentido ser colocados no nome e aquilo que não fizer sentido tem que gerar erros de validação. Então eu quero que você crie uma nova regra dentro da parte das regras que foi mencionado ali em cima, chamado de PersonName, e aí seguindo o padrão da nomenclatura das regras, e eu quero que você substitua dentro do usuário essa regra PersonName.