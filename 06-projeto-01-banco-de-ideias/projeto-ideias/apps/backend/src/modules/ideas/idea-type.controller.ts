import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  DeleteIdeaType,
  LoadDefaultIdeaTypes,
  SaveIdeaType,
} from '@ideias/ideas';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../shared/types/current-user.type';
import { IdeaTypePrismaRepository } from './idea-type.prisma';

interface IdeaTypeView {
  id: string;
  name: string;
  description: string;
  prompt: string;
  updatedAt: Date;
}

interface SaveIdeaTypeBody {
  name: string;
  description: string;
  prompt: string;
}

@Controller('idea-types')
export class IdeaTypeController {
  constructor(
    private readonly ideaTypeRepository: IdeaTypePrismaRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: SaveIdeaTypeBody,
  ): Promise<void> {
    const useCase = new SaveIdeaType(this.ideaTypeRepository);
    await useCase.execute({
      name: body.name,
      description: body.description,
      prompt: body.prompt,
      userId: user.id,
    });
  }

  @Post('load-defaults')
  @HttpCode(HttpStatus.OK)
  async loadDefaults(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ loaded: number }> {
    const useCase = new LoadDefaultIdeaTypes(this.ideaTypeRepository);
    return useCase.execute({ userId: user.id });
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: SaveIdeaTypeBody,
  ): Promise<void> {
    const useCase = new SaveIdeaType(this.ideaTypeRepository);
    await useCase.execute({
      id,
      name: body.name,
      description: body.description,
      prompt: body.prompt,
      userId: user.id,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    const useCase = new DeleteIdeaType(this.ideaTypeRepository);
    await useCase.execute({ id, userId: user.id });
  }

  @Get(':id')
  async findById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<IdeaTypeView> {
    const entity = await this.ideaTypeRepository.findById(id);
    if (!entity || entity.userId !== user.id) {
      throw new NotFoundException('idea-type.not_found');
    }
    return this.toView(entity);
  }

  @Get()
  async findPage(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') pageRaw?: string,
    @Query('pageSize') pageSizeRaw?: string,
  ): Promise<{
    items: IdeaTypeView[];
    page: number;
    perPage: number;
    total: number;
  }> {
    const page = Math.max(parseInt(pageRaw ?? '1', 10) || 1, 1);
    const perPage = Math.min(
      Math.max(parseInt(pageSizeRaw ?? '10', 10) || 10, 1),
      100,
    );
    const result = await this.ideaTypeRepository.findPage({
      userId: user.id,
      page,
      perPage,
    });
    return {
      items: result.items.map((item) => this.toView(item)),
      page: result.page,
      perPage: result.perPage,
      total: result.total,
    };
  }

  private toView(entity: {
    id: string;
    name: string;
    description: string;
    prompt: string;
    updatedAt: Date;
  }): IdeaTypeView {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      prompt: entity.prompt,
      updatedAt: entity.updatedAt,
    };
  }
}
