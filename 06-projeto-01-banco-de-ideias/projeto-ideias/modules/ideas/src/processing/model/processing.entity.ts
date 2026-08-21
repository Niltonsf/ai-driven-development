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
import { ProcessingIteration } from "./processing-iteration.entity";
import {
  ProcessingResource,
  validateProcessingResource,
} from "./processing-resource";

const MAX_ITERATIONS = 50;

export interface ProcessingState extends EntityState {
  userId: string;
  ideaId: string;
  ideaName: string;
  ideaDescription: string;
  ideaObjective: string;
  ideaTypeId: string;
  ideaTypeName: string;
  promptTemplate: string;
  resources?: ProcessingResource[];
  iterations?: ProcessingIteration[];
}

export class Processing extends Entity<ProcessingState> {
  constructor(props: ProcessingState) {
    super({
      ...props,
      resources: props.resources ?? [],
      iterations: props.iterations ?? [],
    });
  }

  get userId(): string {
    return this.props.userId;
  }

  get ideaId(): string {
    return this.props.ideaId;
  }

  get ideaName(): string {
    return this.props.ideaName;
  }

  get ideaDescription(): string {
    return this.props.ideaDescription;
  }

  get ideaObjective(): string {
    return this.props.ideaObjective;
  }

  get ideaTypeId(): string {
    return this.props.ideaTypeId;
  }

  get ideaTypeName(): string {
    return this.props.ideaTypeName;
  }

  get promptTemplate(): string {
    return this.props.promptTemplate;
  }

  get resources(): ProcessingResource[] {
    return this.props.resources as ProcessingResource[];
  }

  get iterations(): ProcessingIteration[] {
    return this.props.iterations as ProcessingIteration[];
  }

  public validate(): void {
    if (this.iterations.length > MAX_ITERATIONS) {
      throw new DomainError("processing.iterations.too_many", 422);
    }

    Validator.validate([
      {
        code: "processing.userId",
        value: this.userId,
        rules: [new RequiredRule(), new UuidRule()],
      },
      {
        code: "processing.ideaId",
        value: this.ideaId,
        rules: [new RequiredRule(), new UuidRule()],
      },
      {
        code: "processing.ideaName",
        value: this.ideaName,
        rules: [
          new RequiredRule(),
          new MinLengthRule(3),
          new MaxLengthRule(120),
        ],
      },
      {
        code: "processing.ideaDescription",
        value: this.ideaDescription,
        rules: [
          new RequiredRule(),
          new MinLengthRule(10),
          new MaxLengthRule(2000),
        ],
      },
      {
        code: "processing.ideaObjective",
        value: this.ideaObjective,
        rules: [
          new RequiredRule(),
          new MinLengthRule(10),
          new MaxLengthRule(1000),
        ],
      },
      {
        code: "processing.ideaTypeId",
        value: this.ideaTypeId,
        rules: [new RequiredRule(), new UuidRule()],
      },
      {
        code: "processing.ideaTypeName",
        value: this.ideaTypeName,
        rules: [
          new RequiredRule(),
          new MinLengthRule(3),
          new MaxLengthRule(120),
        ],
      },
      {
        code: "processing.promptTemplate",
        value: this.promptTemplate,
        rules: [
          new RequiredRule(),
          new MinLengthRule(10),
          new MaxLengthRule(8000),
        ],
      },
    ]);

    for (const resource of this.resources) {
      validateProcessingResource(resource);
    }

    for (const iteration of this.iterations) {
      iteration.validate();
    }

    // A primeira iteracao e criada junto com o Processamento: uma instancia
    // sem nenhuma iteracao e invalida.
    if (this.iterations.length < 1) {
      throw new DomainError("processing.iterations.required", 422);
    }
  }
}
