import { Entity, EntityProps, Id, Result } from '@poupig/shared';
import { CardBrand } from './card-brand.enum';
import { Color } from './color.vo';
import { LastFourDigits } from './last-four-digits.vo';
import { ClosingDay } from './closing-day.vo';
import { DueDay } from './due-day.vo';

export interface CardProps extends EntityProps {
  userId: string;
  name: string;
  description?: string | null;
  brand: CardBrand;
  lastFourDigits?: string | null;
  closingDay: number;
  dueDay: number;
  limit?: number | null;
  color?: string | null;
  icon?: string | null;
  isActive: boolean;
}

export class Card extends Entity<Card, CardProps> {
  private constructor(props: CardProps) {
    super(props);
  }

  static create(props: CardProps): Card {
    const result = Card.tryCreate(props);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  static tryCreate(props: CardProps): Result<Card> {
    const results: Result<any>[] = [
      Id.tryCreate(props.id),
      Id.tryCreate(props.userId, { attribute: 'userId' }),
      ClosingDay.tryCreate(props.closingDay),
      DueDay.tryCreate(props.dueDay),
    ];

    if (props.lastFourDigits) {
      results.push(LastFourDigits.tryCreate(props.lastFourDigits));
    }

    if (props.color) {
      results.push(Color.tryCreate(props.color));
    }

    const combined = Result.combine(results);
    if (combined.isFailure) return Result.fail(combined.errors!);

    return Result.ok(
      new Card({
        ...props,
        id: Id.tryCreate(props.id).instance.value,
        userId: Id.tryCreate(props.userId).instance.value,
        isActive: props.isActive ?? true,
      }),
    );
  }

  get userId(): string { return this.props.userId; }
  get name(): string { return this.props.name; }
  get description(): string | null | undefined { return this.props.description; }
  get brand(): CardBrand { return this.props.brand; }
  get lastFourDigits(): string | null | undefined { return this.props.lastFourDigits; }
  get closingDay(): number { return this.props.closingDay; }
  get dueDay(): number { return this.props.dueDay; }
  get limit(): number | null | undefined { return this.props.limit; }
  get color(): string | null | undefined { return this.props.color; }
  get icon(): string | null | undefined { return this.props.icon; }
  get isActive(): boolean { return this.props.isActive; }

  softDelete(): Result<Card> {
    return this.cloneWith({ deletedAt: new Date() });
  }
}
