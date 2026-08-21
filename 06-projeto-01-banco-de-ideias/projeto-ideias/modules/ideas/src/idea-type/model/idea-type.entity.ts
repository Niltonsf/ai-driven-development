import {
  Entity,
  EntityState,
  MaxLengthRule,
  MinLengthRule,
  RequiredRule,
  UuidRule,
  Validator,
} from "@ideias/shared";

export interface IdeaTypeState extends EntityState {
  name: string;
  description: string;
  prompt: string;
  userId: string;
}

export class IdeaType extends Entity<IdeaTypeState> {
  constructor(props: IdeaTypeState) {
    super(props);
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get prompt(): string {
    return this.props.prompt;
  }

  get userId(): string {
    return this.props.userId;
  }

  public validate(): void {
    Validator.validate([
      {
        code: "idea-type.name",
        value: this.name,
        rules: [
          new RequiredRule(),
          new MinLengthRule(3),
          new MaxLengthRule(120),
        ],
      },
      {
        code: "idea-type.description",
        value: this.description,
        rules: [
          new RequiredRule(),
          new MinLengthRule(10),
          new MaxLengthRule(500),
        ],
      },
      {
        code: "idea-type.prompt",
        value: this.prompt,
        rules: [
          new RequiredRule(),
          new MinLengthRule(20),
          new MaxLengthRule(8000),
        ],
      },
      {
        code: "idea-type.userId",
        value: this.userId,
        rules: [new RequiredRule(), new UuidRule()],
      },
    ]);
  }
}
