import {
  DomainError,
  MaxLengthRule,
  MinLengthRule,
  RequiredRule,
  UseCase,
  Validator,
} from "@ideias/shared";
import {
  ProcessingIteration,
  composeRefinementUserMessage,
  resolveSystemPrompt,
} from "../model";
import { AiProvider, ProcessingRepository } from "../provider";

export interface RefineProcessingIn {
  processingId: string;
  userId: string;
  refinement: string;
}

const MAX_ITERATIONS = 50;

export class RefineProcessing
  implements UseCase<RefineProcessingIn, ProcessingIteration>
{
  constructor(
    private readonly processingRepository: ProcessingRepository,
    private readonly aiProvider: AiProvider,
  ) {}

  async execute(input: RefineProcessingIn): Promise<ProcessingIteration> {
    const processing = await this.processingRepository.findById(
      input.processingId,
    );
    // userId diferente tambem retorna not_found: nao vazar existencia
    // cross-user via 403.
    if (!processing || processing.userId !== input.userId) {
      throw new DomainError("processing.not_found", 404);
    }

    Validator.validate([
      {
        code: "processing.refinement",
        value: input.refinement,
        rules: [
          new RequiredRule(),
          new MinLengthRule(3),
          new MaxLengthRule(2000),
        ],
      },
    ]);

    if (processing.iterations.length >= MAX_ITERATIONS) {
      throw new DomainError("processing.iterations.too_many", 422);
    }

    const systemPrompt = resolveSystemPrompt({
      ideaName: processing.ideaName,
      ideaDescription: processing.ideaDescription,
      ideaObjective: processing.ideaObjective,
      promptTemplate: processing.promptTemplate,
      resources: processing.resources,
    });

    const userMessage = composeRefinementUserMessage(
      processing.iterations,
      input.refinement,
    );

    const result = await this.aiProvider.generate({
      systemPrompt,
      userMessage,
    });

    const iteration = new ProcessingIteration({
      refinement: input.refinement,
      result,
      position: processing.iterations.length,
    });
    iteration.validate();

    await this.processingRepository.appendIteration(processing.id, iteration);

    return iteration;
  }
}
