import { Result, UseCase } from '@poupig/shared';
import { CategoryRepository } from '../provider';

export const DeleteCategoryErrors = {
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export interface DeleteCategoryInput {
  id: string;
  userId: string;
}

export class DeleteCategory implements UseCase<DeleteCategoryInput, void> {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: DeleteCategoryInput): Promise<Result<void>> {
    const existingResult = await this.categoryRepository.findById(input.id);
    if (existingResult.isFailure) return Result.fail(existingResult.errors!);

    const category = existingResult.instance;

    if (!category) {
      return Result.fail(DeleteCategoryErrors.CATEGORY_NOT_FOUND);
    }

    if (category.userId !== input.userId) {
      return Result.fail(DeleteCategoryErrors.UNAUTHORIZED);
    }

    const deletedResult = category.softDelete();
    if (deletedResult.isFailure) return Result.fail(deletedResult.errors!);

    return this.categoryRepository.save(deletedResult.instance);
  }
}
