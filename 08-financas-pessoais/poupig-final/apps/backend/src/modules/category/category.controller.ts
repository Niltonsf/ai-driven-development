import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApplyDefaultCategories,
  DeleteCategory,
  DeleteCategoryErrors,
  SaveCategory,
  SaveCategoryErrors,
} from '@poupig/category';
import { CurrentUser } from '../../shared/decorators';
import { CategoryPrisma } from './category.prisma';

type AuthUser = { id: string; name: string; email: string };

interface SaveSubcategoryBody {
  id?: string;
  name: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  order: number;
}

interface SaveCategoryBody {
  name: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  subcategories: SaveSubcategoryBody[];
}

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryPrisma: CategoryPrisma) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: SaveCategoryBody, @CurrentUser() user: AuthUser) {
    const { randomUUID } = await import('node:crypto');
    const useCase = new SaveCategory(this.categoryPrisma);
    const result = await useCase.execute({ id: randomUUID(), userId: user.id, ...body });
    if (result.isFailure) {
      throw this.mapSaveError(result.errors ?? []);
    }
    return { success: true };
  }

  @Post('default')
  async applyDefaults(@CurrentUser() user: AuthUser) {
    const useCase = new ApplyDefaultCategories(this.categoryPrisma);
    const result = await useCase.execute({ userId: user.id });
    if (result.isFailure) throw new BadRequestException(result.errors);
    return { success: true };
  }

  @Get()
  async findAll(@CurrentUser() user: AuthUser) {
    const result = await this.categoryPrisma.findCategoriesByUserId.execute(user.id);
    if (result.isFailure) throw new BadRequestException(result.errors);
    return result.instance;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: SaveCategoryBody, @CurrentUser() user: AuthUser) {
    const useCase = new SaveCategory(this.categoryPrisma);
    const result = await useCase.execute({ id, userId: user.id, ...body });
    if (result.isFailure) {
      throw this.mapSaveError(result.errors ?? []);
    }
    return { success: true };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const useCase = new DeleteCategory(this.categoryPrisma);
    const result = await useCase.execute({ id, userId: user.id });
    if (result.isFailure) {
      const errors = result.errors ?? [];
      if (errors.includes(DeleteCategoryErrors.CATEGORY_NOT_FOUND)) {
        throw new NotFoundException(DeleteCategoryErrors.CATEGORY_NOT_FOUND);
      }
      if (errors.includes(DeleteCategoryErrors.UNAUTHORIZED)) {
        throw new ForbiddenException(DeleteCategoryErrors.UNAUTHORIZED);
      }
      throw new BadRequestException(errors);
    }
    return { success: true };
  }

  private mapSaveError(errors: string[]) {
    if (errors.includes(SaveCategoryErrors.UNAUTHORIZED)) {
      return new ForbiddenException(SaveCategoryErrors.UNAUTHORIZED);
    }
    if (errors.includes(SaveCategoryErrors.CATEGORY_NAME_ALREADY_EXISTS)) {
      return new BadRequestException(SaveCategoryErrors.CATEGORY_NAME_ALREADY_EXISTS);
    }
    if (errors.includes(SaveCategoryErrors.DUPLICATE_SUBCATEGORY_ORDER)) {
      return new BadRequestException(SaveCategoryErrors.DUPLICATE_SUBCATEGORY_ORDER);
    }
    return new BadRequestException(errors);
  }
}
