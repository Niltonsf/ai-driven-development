import {
  DayOfMonth,
  Entity,
  EntityProps,
  HexColor,
  Id,
  NonNegative,
  optional,
  Result,
} from '@arquitetura/shared';
import { NomeCartao } from './nome-cartao.vo';
import { DescricaoCartao } from './descricao-cartao.vo';
import { BandeiraCartao } from './bandeira-cartao.vo';
import { UltimosDigitosCartao } from './ultimos-digitos-cartao.vo';
import { IconeCartao } from './icone-cartao.vo';

export interface CartaoProps extends EntityProps {
  name: string;
  description?: string;
  limit?: number;
  closingDay?: number;
  dueDay?: number;
  flag?: string;
  lastDigits?: string;
  active?: boolean;
  color?: string;
  icon?: string;
}

export class Cartao extends Entity<Cartao, CartaoProps> {
  private constructor(props: CartaoProps) {
    super(props);
  }

  static create(props: CartaoProps): Cartao {
    const result = Cartao.tryCreate(props);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  static tryCreate(props: CartaoProps): Result<Cartao> {
    const id = Id.tryCreate(props.id);
    const name = NomeCartao.tryCreate(props.name);

    const description = optional(props.description, DescricaoCartao);
    const limit = optional(props.limit, NonNegative);
    const closingDay = optional(props.closingDay, DayOfMonth);
    const dueDay = optional(props.dueDay, DayOfMonth);
    const flag = optional(props.flag, BandeiraCartao);
    const lastDigits = optional(props.lastDigits, UltimosDigitosCartao);
    const color = optional(props.color, HexColor);
    const icon = optional(props.icon, IconeCartao);

    const attributes = Result.combine(
      [id, name, description, limit, closingDay, dueDay, flag, lastDigits, color, icon].filter(
        Boolean,
      ) as Result<unknown>[],
    );
    if (attributes.isFailure) return Result.fail(attributes.errors!);

    return Result.ok(
      new Cartao({
        ...props,
        id: id.instance.value,
        name: name.instance.value,
        description: description?.instance.value,
        limit: limit?.instance.value,
        closingDay: closingDay?.instance.value,
        dueDay: dueDay?.instance.value,
        flag: flag?.instance.value,
        lastDigits: lastDigits?.instance.value,
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

  get limit(): number | undefined {
    return this.props.limit;
  }

  get closingDay(): number | undefined {
    return this.props.closingDay;
  }

  get dueDay(): number | undefined {
    return this.props.dueDay;
  }

  get flag(): string | undefined {
    return this.props.flag;
  }

  get lastDigits(): string | undefined {
    return this.props.lastDigits;
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

  activate(): Result<Cartao> {
    return this.cloneWith({ active: true });
  }

  deactivate(): Result<Cartao> {
    return this.cloneWith({ active: false });
  }
}
