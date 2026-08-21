import {
  Entity,
  EntityState,
  InRule,
  IntegerRule,
  MaxLengthRule,
  MinLengthRule,
  MinValueRule,
  RequiredRule,
  Validator,
} from "@ideias/shared";

export const RESOURCE_TYPES = ["text"] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export interface ResourceState extends EntityState {
  type: ResourceType;
  content: string;
  position: number;
}

export class Resource extends Entity<ResourceState> {
  constructor(props: ResourceState) {
    super(props);
  }

  get type(): ResourceType {
    return this.props.type;
  }

  get content(): string {
    return this.props.content;
  }

  get position(): number {
    return this.props.position;
  }

  public validate(): void {
    Validator.validate([
      {
        code: "idea.resource.type",
        value: this.type,
        rules: [new RequiredRule(), new InRule(RESOURCE_TYPES)],
      },
      {
        code: "idea.resource.content",
        value: this.content,
        rules: [
          new RequiredRule(),
          new MinLengthRule(1),
          new MaxLengthRule(20000),
        ],
      },
      {
        code: "idea.resource.position",
        value: this.position,
        rules: [new RequiredRule(), new IntegerRule(), new MinValueRule(0)],
      },
    ]);
  }
}
