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
import { DeleteIdea, Idea, SaveIdea } from '@ideias/ideas';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../shared/types/current-user.type';
import { IdeaPrismaRepository } from './idea.prisma';
import { IdeaTypePrismaRepository } from './idea-type.prisma';

interface ResourceResponse {
  id: string;
  type: string;
  content: string;
  position: number;
}

interface IdeaResponse {
  id: string;
  name: string;
  description: string;
  objective: string;
  ideaTypeId: string;
  updatedAt: string;
}

interface IdeaDetailResponse extends IdeaResponse {
  resources: ResourceResponse[];
}

interface SaveResourceBody {
  id?: string;
  type: string;
  content: string;
  position: number;
}

interface SaveIdeaBody {
  name: string;
  description: string;
  objective: string;
  ideaTypeId: string;
  resources?: SaveResourceBody[];
}

@Controller('ideas')
export class IdeaController {
  constructor(
    private readonly ideaRepository: IdeaPrismaRepository,
    private readonly ideaTypeRepository: IdeaTypePrismaRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: SaveIdeaBody,
  ): Promise<void> {
    const useCase = new SaveIdea(this.ideaRepository, this.ideaTypeRepository);
    await useCase.execute({
      name: body.name,
      description: body.description,
      objective: body.objective,
      ideaTypeId: body.ideaTypeId,
      userId: user.id,
      resources: body.resources ?? [],
    });
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: SaveIdeaBody,
  ): Promise<void> {
    const useCase = new SaveIdea(this.ideaRepository, this.ideaTypeRepository);
    await useCase.execute({
      id,
      name: body.name,
      description: body.description,
      objective: body.objective,
      ideaTypeId: body.ideaTypeId,
      userId: user.id,
      resources: body.resources ?? [],
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    const useCase = new DeleteIdea(this.ideaRepository);
    await useCase.execute({ id, userId: user.id });
  }

  @Get(':id')
  async findById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<IdeaDetailResponse> {
    const entity = await this.ideaRepository.findById(id);
    if (!entity || entity.userId !== user.id) {
      throw new NotFoundException('idea.not_found');
    }
    return this.toDetailResponse(entity);
  }

  // GET /ideas (paginado) NAO inclui resources no payload — o array items
  // mantem o formato enxuto; o detalhe vem de GET /ideas/:id.
  @Get()
  async findPage(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') pageRaw?: string,
    @Query('pageSize') pageSizeRaw?: string,
  ): Promise<{
    items: IdeaResponse[];
    page: number;
    perPage: number;
    total: number;
  }> {
    const page = Math.max(parseInt(pageRaw ?? '1', 10) || 1, 1);
    const perPage = Math.min(
      Math.max(parseInt(pageSizeRaw ?? '10', 10) || 10, 1),
      100,
    );
    const result = await this.ideaRepository.findPage({
      userId: user.id,
      page,
      perPage,
    });
    return {
      items: result.items.map((item) => this.toResponse(item)),
      page: result.page,
      perPage: result.perPage,
      total: result.total,
    };
  }

  private toResponse(entity: Idea): IdeaResponse {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      objective: entity.objective,
      ideaTypeId: entity.ideaTypeId,
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toDetailResponse(entity: Idea): IdeaDetailResponse {
    return {
      ...this.toResponse(entity),
      resources: entity.resources.map((resource) => ({
        id: resource.id,
        type: resource.type,
        content: resource.content,
        position: resource.position,
      })),
    };
  }
}
