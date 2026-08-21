import { DomainError, UseCase } from "@ideias/shared";
import { IdeaTypeRepository } from "../../idea-type/provider";
import { Idea, RESOURCE_TYPES, Resource, ResourceType } from "../model";
import { IdeaRepository } from "../provider";

export interface SaveResourceIn {
  id?: string;
  type: string;
  content: string;
  position: number;
}

export interface SaveIdeaIn {
  id?: string;
  name: string;
  description: string;
  objective: string;
  ideaTypeId: string;
  userId: string;
  resources?: SaveResourceIn[];
}

const SUPPORTED_TYPES: ReadonlySet<string> = new Set(RESOURCE_TYPES);

export class SaveIdea implements UseCase<SaveIdeaIn, void> {
  constructor(
    private readonly ideaRepository: IdeaRepository,
    private readonly ideaTypeRepository: IdeaTypeRepository,
  ) {}

  async execute(input: SaveIdeaIn): Promise<void> {
    const resources = this.buildResources(input.resources ?? []);

    new Idea({
      id: input.id,
      name: input.name,
      description: input.description,
      objective: input.objective,
      ideaTypeId: input.ideaTypeId,
      userId: input.userId,
      resources,
    }).validate();

    const ideaType = await this.ideaTypeRepository.findById(input.ideaTypeId);
    if (!ideaType || ideaType.userId !== input.userId) {
      throw new DomainError("idea.ideaType.invalid", 422);
    }

    const existing = input.id
      ? await this.ideaRepository.findById(input.id)
      : null;

    if (existing && existing.userId !== input.userId) {
      throw new DomainError("idea.forbidden", 403);
    }

    if (existing) {
      const updated = existing.clone({
        name: input.name,
        description: input.description,
        objective: input.objective,
        ideaTypeId: input.ideaTypeId,
        resources,
      });
      updated.validate();
      await this.ideaRepository.update(updated);
      return;
    }

    const entity = new Idea({
      id: input.id,
      name: input.name,
      description: input.description,
      objective: input.objective,
      ideaTypeId: input.ideaTypeId,
      userId: input.userId,
      resources,
    });
    entity.validate();
    await this.ideaRepository.create(entity);
  }

  private buildResources(items: SaveResourceIn[]): Resource[] {
    return items.map((item) => {
      // Distingue "tipo nao suportado" de "tipo ausente": quando ha um valor
      // informado que nao pertence ao union, falha antes da entidade.
      if (item.type && !SUPPORTED_TYPES.has(item.type)) {
        throw new DomainError("idea.resource.type.unsupported", 422);
      }
      return new Resource({
        id: item.id ? item.id : undefined,
        type: item.type as ResourceType,
        content: item.content,
        position: item.position,
      });
    });
  }
}
