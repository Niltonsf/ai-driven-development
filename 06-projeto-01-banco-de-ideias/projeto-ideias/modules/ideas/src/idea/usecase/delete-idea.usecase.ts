import { DomainError, UseCase } from "@ideias/shared";
import { IdeaRepository } from "../provider";

export interface DeleteIdeaIn {
  id: string;
  userId: string;
}

export class DeleteIdea implements UseCase<DeleteIdeaIn, void> {
  constructor(private readonly ideaRepository: IdeaRepository) {}

  async execute(input: DeleteIdeaIn): Promise<void> {
    const existing = await this.ideaRepository.findById(input.id);

    if (!existing) {
      throw new DomainError("idea.not_found", 404);
    }

    if (existing.userId !== input.userId) {
      throw new DomainError("idea.forbidden", 403);
    }

    // Os recursos da Ideia sao removidos junto: a cascata e garantida pela FK
    // do banco (onDelete: Cascade); nenhuma logica adicional e necessaria aqui.
    await this.ideaRepository.delete(input.id);
  }
}
