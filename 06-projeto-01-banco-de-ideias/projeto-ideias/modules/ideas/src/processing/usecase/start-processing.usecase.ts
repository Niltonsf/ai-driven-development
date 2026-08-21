import { DomainError, UseCase } from "@ideias/shared";
import { IdeaRepository } from "../../idea/provider";
import { IdeaTypeRepository } from "../../idea-type/provider";
import {
  Processing,
  ProcessingIteration,
  ProcessingResource,
  resolveSystemPrompt,
} from "../model";
import { AiProvider, ProcessingRepository } from "../provider";

export interface StartProcessingIn {
  ideaId: string;
  userId: string;
}

const FIRST_USER_MESSAGE = "Gere o primeiro resultado para esta Ideia.";

export class StartProcessing implements UseCase<StartProcessingIn, Processing> {
  constructor(
    private readonly processingRepository: ProcessingRepository,
    private readonly ideaRepository: IdeaRepository,
    private readonly ideaTypeRepository: IdeaTypeRepository,
    private readonly aiProvider: AiProvider,
  ) {}

  async execute(input: StartProcessingIn): Promise<Processing> {
    const idea = await this.ideaRepository.findById(input.ideaId);
    if (!idea || idea.userId !== input.userId) {
      throw new DomainError("processing.idea.invalid", 422);
    }

    const ideaType = await this.ideaTypeRepository.findById(idea.ideaTypeId);
    if (!ideaType) {
      throw new DomainError("processing.idea.invalid", 422);
    }

    // Snapshot: copia profunda dos campos que importam para a geracao. Edicoes
    // posteriores na Ideia ou no Tipo nao afetam este Processamento.
    const resources: ProcessingResource[] = idea.resources
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((resource) => ({
        type: resource.type,
        content: resource.content,
        position: resource.position,
      }));

    const snapshot = {
      ideaName: idea.name,
      ideaDescription: idea.description,
      ideaObjective: idea.objective,
      ideaTypeId: ideaType.id,
      ideaTypeName: ideaType.name,
      promptTemplate: ideaType.prompt,
      resources,
    };

    const systemPrompt = resolveSystemPrompt({
      ideaName: snapshot.ideaName,
      ideaDescription: snapshot.ideaDescription,
      ideaObjective: snapshot.ideaObjective,
      promptTemplate: snapshot.promptTemplate,
      resources: snapshot.resources,
    });

    const result = await this.aiProvider.generate({
      systemPrompt,
      userMessage: FIRST_USER_MESSAGE,
    });

    const iteration = new ProcessingIteration({
      refinement: null,
      result,
      position: 0,
    });

    const processing = new Processing({
      userId: input.userId,
      ideaId: idea.id,
      ideaName: snapshot.ideaName,
      ideaDescription: snapshot.ideaDescription,
      ideaObjective: snapshot.ideaObjective,
      ideaTypeId: snapshot.ideaTypeId,
      ideaTypeName: snapshot.ideaTypeName,
      promptTemplate: snapshot.promptTemplate,
      resources: snapshot.resources,
      iterations: [iteration],
    });
    processing.validate();

    return this.processingRepository.create(processing);
  }
}
