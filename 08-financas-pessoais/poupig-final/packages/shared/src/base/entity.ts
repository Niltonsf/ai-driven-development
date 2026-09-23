import { Id } from '../vo/id.vo';
import { Result } from './result';

export interface EntityProps {
  id?: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
}

export type EntityDiff<Props> = Partial<{
  [Key in keyof Props]: {
    previous: Props[Key];
    current: Props[Key];
  };
}>;

export interface ClonePropsResult<Props> {
  props: Props;
  diff: EntityDiff<Props>;
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

  public cloneProps(overrides: Partial<Props>): ClonePropsResult<Props> {
    const currentProps = this.deepClone(this.props);
    const nextProps = this.deepMerge(currentProps, overrides);

    return {
      props: nextProps,
      diff: this.diffProps(this.props, nextProps),
    };
  }

  public cloneWith(overrides: Partial<Props>): Result<Type> {
    const { props } = this.cloneProps(overrides);
    const constructorRef = this.constructor as any;
    const tryCreate = constructorRef.tryCreate;

    if (typeof tryCreate === 'function') {
      return tryCreate.call(constructorRef, props);
    }

    try {
      return Result.ok(new constructorRef(props));
    } catch (error: unknown) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }

      return Result.fail('ENTITY_CLONE_ERROR');
    }
  }

  public clone(overrides: Partial<Props>): Result<Type> {
    return this.cloneWith(overrides);
  }

  public toJSON(): Props {
    return this.props;
  }

  private diffProps(previous: Props, current: Props): EntityDiff<Props> {
    const diff: EntityDiff<Props> = {};

    for (const key of new Set([...Object.keys(previous), ...Object.keys(current)]) as Set<keyof Props>) {
      if (!this.isEqual(previous[key], current[key])) {
        diff[key] = {
          previous: previous[key],
          current: current[key],
        };
      }
    }

    return diff;
  }

  private deepClone<Value>(value: Value): Value {
    if (value === null || typeof value !== 'object') {
      return value;
    }

    if (value instanceof Date) {
      return new Date(value.getTime()) as unknown as Value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.deepClone(item)) as unknown as Value;
    }

    if (this.isPlainObject(value)) {
      const clone: Record<string, unknown> = {};
      for (const key of Object.keys(value)) {
        clone[key] = this.deepClone(value[key]);
      }
      return clone as unknown as Value;
    }

    return value;
  }

  private isPlainObject(val: unknown): val is Record<string, unknown> {
    return val !== null && typeof val === 'object' && !Array.isArray(val) && Object.getPrototypeOf(val) === Object.prototype;
  }

  private deepMerge(target: any, source: any): any {
    if (!this.isPlainObject(source)) {
      return target;
    }

    for (const key of Object.keys(source)) {
      if (this.isPlainObject(source[key])) {
        if (!this.isPlainObject(target[key])) target[key] = {};
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  private isEqual(left: any, right: any): boolean {
    if (left === right) {
      return true;
    }

    if (left instanceof Date && right instanceof Date) {
      return left.getTime() === right.getTime();
    }

    if (left && right && typeof left === 'object' && typeof right === 'object') {
      if (Array.isArray(left) || Array.isArray(right)) {
        if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
          return false;
        }

        return left.every((item, index) => this.isEqual(item, right[index]));
      }

      const leftKeys = Object.keys(left);
      const rightKeys = Object.keys(right);

      if (leftKeys.length !== rightKeys.length) {
        return false;
      }

      return leftKeys.every((key) => this.isEqual(left[key], right[key]));
    }

    return false;
  }
}
