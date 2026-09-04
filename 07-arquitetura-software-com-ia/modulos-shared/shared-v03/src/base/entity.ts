import { Id } from '../vo/id.vo';

export interface EntityProps {
  id?: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
}

export abstract class Entity<Type, Props extends EntityProps> {
  readonly id: string;

  protected constructor(public readonly props: Props) {
    const id = Id.create(props.id!, { attribute: 'id' }).value;
    this.id = id;
    this.props = {
      ...props,
      id,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
      deletedAt: props.deletedAt ?? null,
    };
  }

  get createdAt() {
    return this.props.createdAt!;
  }

  get updatedAt() {
    return this.props.updatedAt!;
  }

  get deletedAt() {
    return this.props?.deletedAt ?? null;
  }

  equals(entity: Entity<Type, Props>): boolean {
    return this.id === entity.id;
  }

  notEquals(entity: Entity<Type, Props>): boolean {
    return this.id !== entity.id;
  }

  public toJSON(): Props {
    return this.props;
  }
}
