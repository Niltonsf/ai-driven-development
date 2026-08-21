import { DomainError, UseCase } from "@ideias/shared";
import { IdeaTypeRepository } from "../provider";

export interface DeleteIdeaTypeIn {
  id: string;
  userId: string;
}

export class DeleteIdeaType implements UseCase<DeleteIdeaTypeIn, void> {
  constructor(private readonly ideaTypeRepository: IdeaTypeRepository) {}

  async execute(input: DeleteIdeaTypeIn): Promise<void> {
    const existing = await this.ideaTypeRepository.findById(input.id);

    if (!existing) {
      throw new DomainError("idea-type.not_found", 404);
    }

    if (existing.userId !== input.userId) {
      throw new DomainError("idea-type.forbidden", 403);
    }

    await this.ideaTypeRepository.delete(input.id);
  }
}
