import { UseCase } from "@ideias/shared";
import { DEFAULT_IDEA_TYPES } from "../constant";
import { IdeaType } from "../model";
import { IdeaTypeRepository } from "../provider";

export interface LoadDefaultIdeaTypesIn {
  userId: string;
}

export interface LoadDefaultIdeaTypesOut {
  loaded: number;
}

export class LoadDefaultIdeaTypes
  implements UseCase<LoadDefaultIdeaTypesIn, LoadDefaultIdeaTypesOut>
{
  constructor(private readonly ideaTypeRepository: IdeaTypeRepository) {}

  async execute(
    input: LoadDefaultIdeaTypesIn,
  ): Promise<LoadDefaultIdeaTypesOut> {
    const existing = await this.ideaTypeRepository.findPage({
      userId: input.userId,
      page: 1,
      perPage: 1,
    });

    if (existing.total > 0) {
      return { loaded: 0 };
    }

    for (const item of DEFAULT_IDEA_TYPES) {
      const entity = new IdeaType({
        name: item.name,
        description: item.description,
        prompt: item.prompt,
        userId: input.userId,
      });
      entity.validate();
      await this.ideaTypeRepository.create(entity);
    }

    return { loaded: DEFAULT_IDEA_TYPES.length };
  }
}
