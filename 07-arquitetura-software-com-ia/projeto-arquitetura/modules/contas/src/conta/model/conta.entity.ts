import { Entity, EntityProps, HexColor, Id, optional, Result } from '@arquitetura/shared';
import { NomeConta } from './nome-conta.vo';
import { DescricaoConta } from './descricao-conta.vo';
import { AgenciaConta } from './agencia-conta.vo';
import { NumeroConta } from './numero-conta.vo';
import { InstituicaoConta } from './instituicao-conta.vo';
import { IconeConta } from './icone-conta.vo';

export interface ContaProps extends EntityProps {
  name: string;
  description?: string;
  agency?: string;
  accountNumber?: string;
  institutionName?: string;
  active?: boolean;
  color?: string;
  icon?: string;
}

export class Conta extends Entity<Conta, ContaProps> {
  private constructor(props: ContaProps) {
    super(props);
  }

  static create(props: ContaProps): Conta {
    const result = Conta.tryCreate(props);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  static tryCreate(props: ContaProps): Result<Conta> {
    const id = Id.tryCreate(props.id);
    const name = NomeConta.tryCreate(props.name);

    const description = optional(props.description, DescricaoConta);
    const agency = optional(props.agency, AgenciaConta);
    const accountNumber = optional(props.accountNumber, NumeroConta);
    const institutionName = optional(props.institutionName, InstituicaoConta);
    const color = optional(props.color, HexColor);
    const icon = optional(props.icon, IconeConta);

    const attributes = Result.combine(
      [id, name, description, agency, accountNumber, institutionName, color, icon].filter(Boolean) as Result<unknown>[],
    );
    if (attributes.isFailure) return Result.fail(attributes.errors!);

    return Result.ok(
      new Conta({
        ...props,
        id: id.instance.value,
        name: name.instance.value,
        description: description?.instance.value,
        agency: agency?.instance.value,
        accountNumber: accountNumber?.instance.value,
        institutionName: institutionName?.instance.value,
        color: color?.instance.value,
        icon: icon?.instance.value,
        active: props.active ?? true,
      }),
    );
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get agency(): string | undefined {
    return this.props.agency;
  }

  get accountNumber(): string | undefined {
    return this.props.accountNumber;
  }

  get institutionName(): string | undefined {
    return this.props.institutionName;
  }

  get active(): boolean {
    return this.props.active!;
  }

  get color(): string | undefined {
    return this.props.color;
  }

  get icon(): string | undefined {
    return this.props.icon;
  }

  activate(): Result<Conta> {
    return this.cloneWith({ active: true });
  }

  deactivate(): Result<Conta> {
    return this.cloneWith({ active: false });
  }
}
