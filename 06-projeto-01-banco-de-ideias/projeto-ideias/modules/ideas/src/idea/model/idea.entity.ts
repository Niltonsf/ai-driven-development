import {
  DomainError,
  Entity,
  EntityState,
  MaxLengthRule,
  MinLengthRule,
  RequiredRule,
  UuidRule,
  Validator,
} from "@ideias/shared";
import { Resource } from "./resource.entity";

const MAX_RESOURCES = 20;

export interface IdeaState extends EntityState {
  name: string;
  description: string;
  objective: string;
  ideaTypeId: string;
  userId: string;
  resources?: Resource[];
}

export class Idea extends Entity<IdeaState> {
  constructor(props: IdeaState) {
    super({ ...props, resources: props.resources ?? [] });
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get objective(): string {
    return this.props.objective;
  }

  get ideaTypeId(): string {
    return this.props.ideaTypeId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get resources(): Resource[] {
    // O construtor garante a colecao ([] quando ausente), entao a leitura e
    // sempre um array materializado.
    return this.props.resources as Resource[];
  }

  public validate(): void {
    if (this.resources.length > MAX_RESOURCES) {
      throw new DomainError("idea.resources.too_many", 422);
    }

    const seenIds = new Set<string>();
    for (const resource of this.resources) {
      if (seenIds.has(resource.id)) {
        throw new DomainError("idea.resources.duplicate_id", 422);
      }
      seenIds.add(resource.id);
    }

    Validator.validate([
      {
        code: "idea.name",
        value: this.name,
        rules: [
          new RequiredRule(),
          new MinLengthRule(3),
          new MaxLengthRule(120),
        ],
      },
      {
        code: "idea.description",
        value: this.description,
        rules: [
          new RequiredRule(),
          new MinLengthRule(10),
          new MaxLengthRule(2000),
        ],
      },
      {
        code: "idea.objective",
        value: this.objective,
        rules: [
          new RequiredRule(),
          new MinLengthRule(10),
          new MaxLengthRule(1000),
        ],
      },
      {
        code: "idea.ideaTypeId",
        value: this.ideaTypeId,
        rules: [new RequiredRule(), new UuidRule()],
      },
      {
        code: "idea.userId",
        value: this.userId,
        rules: [new RequiredRule(), new UuidRule()],
      },
    ]);

    for (const resource of this.resources) {
      resource.validate();
    }
  }
}
