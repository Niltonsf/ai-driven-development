import {
  Entity,
  EntityState,
  IntegerRule,
  MaxLengthRule,
  MinLengthRule,
  MinValueRule,
  RequiredRule,
  Validator,
} from "@ideias/shared";

export interface ProcessingIterationState extends EntityState {
  // null na primeira iteracao (geracao inicial); texto curto nas seguintes.
  refinement: string | null;
  result: string;
  position: number;
}

export class ProcessingIteration extends Entity<ProcessingIterationState> {
  constructor(props: ProcessingIterationState) {
    super(props);
  }

  get refinement(): string | null {
    return this.props.refinement;
  }

  get result(): string {
    return this.props.result;
  }

  get position(): number {
    return this.props.position;
  }

  public validate(): void {
    // A entidade nao sabe se e a primeira iteracao; quem garante "refinement
    // obrigatorio a partir da 2a" e o caso de uso refine-processing. Aqui a
    // regra e: se houver refinement, ele respeita min 3 / max 2000.
    if (this.refinement !== null) {
      Validator.validate([
        {
          code: "processing.refinement",
          value: this.refinement,
          rules: [new MinLengthRule(3), new MaxLengthRule(2000)],
        },
      ]);
    }

    Validator.validate([
      {
        code: "processing.iteration.result",
        value: this.result,
        rules: [
          new RequiredRule(),
          new MinLengthRule(1),
          new MaxLengthRule(50000),
        ],
      },
      {
        code: "processing.iteration.position",
        value: this.position,
        rules: [new RequiredRule(), new IntegerRule(), new MinValueRule(0)],
      },
    ]);
  }
}
