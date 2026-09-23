import { Result } from '@poupig/shared';
import { CategoryDTO } from '../dto';

export interface FindCategoriesByUserIdQuery {
  execute(userId: string): Promise<Result<CategoryDTO[]>>;
}
