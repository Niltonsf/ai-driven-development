import { DomainError, UseCase } from "@ideias/shared";
import { IdeaType } from "../model";
import { IdeaTypeRepository } from "../provider";

export interface SaveIdeaTypeIn {
  id?: string;
  name: string;
  description: string;
  prompt: string;
  userId: string;
}

export class SaveIdeaType implements UseCase<SaveIdeaTypeIn, void> {
  constructor(private readonly ideaTypeRepository: IdeaTypeRepository) {}

  async execute(input: SaveIdeaTypeIn): Promise<void> {
    const existing = input.id
      ? await this.ideaTypeRepository.findById(input.id)
      : null;

    if (existing && existing.userId !== input.userId) {
      throw new DomainError("idea-type.forbidden", 403);
    }

    if (existing) {
      const updated = existing.clone({
        name: input.name,
        description: input.description,
        prompt: input.prompt,
      });
      updated.validate();
      await this.ideaTypeRepository.update(updated);
      return;
    }

    const entity = new IdeaType({
      id: input.id,
      name: input.name,
      description: input.description,
      prompt: input.prompt,
      userId: input.userId,
    });
    entity.validate();
    await this.ideaTypeRepository.create(entity);
  }
}
