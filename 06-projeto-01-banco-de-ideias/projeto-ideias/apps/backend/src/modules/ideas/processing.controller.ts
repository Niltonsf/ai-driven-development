import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  AiProvider,
  DeleteProcessing,
  Processing,
  ProcessingIteration,
  RefineProcessing,
  StartProcessing,
} from '@ideias/ideas';
import { DomainError } from '@ideias/shared';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../shared/types/current-user.type';
import { ProcessingPrismaRepository } from './processing.prisma';
import { IdeaPrismaRepository } from './idea.prisma';
import { IdeaTypePrismaRepository } from './idea-type.prisma';

interface StartBody {
  ideaId?: string;
}

interface RefineBody {
  refinement?: string;
}

interface IterationResponse {
  id: string;
  refinement: string | null;
  result: string;
  position: number;
  createdAt: string;
}

interface ProcessingDetailResponse {
  id: string;
  ideaId: string;
  ideaName: string;
  ideaDescription: string;
  ideaObjective: string;
  ideaTypeId: string;
  ideaTypeName: string;
  resources: { type: string; content: string; position: number }[];
  iterations: IterationResponse[];
  createdAt: string;
  updatedAt: string;
}

const SEARCH_TERM_MAX = 100;

@Controller('processings')
export class ProcessingController {
  constructor(
    private readonly processingRepository: ProcessingPrismaRepository,
    private readonly ideaRepository: IdeaPrismaRepository,
    private readonly ideaTypeRepository: IdeaTypePrismaRepository,
    private readonly aiProvider: AiProvider,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async start(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: StartBody,
  ): Promise<ProcessingDetailResponse> {
    const useCase = new StartProcessing(
      this.processingRepository,
      this.ideaRepository,
      this.ideaTypeRepository,
      this.aiProvider,
    );
    const processing = await useCase.execute({
      ideaId: typeof body.ideaId === 'string' ? body.ideaId : '',
      userId: user.id,
    });
    return this.toDetailResponse(processing);
  }

  @Post(':id/iterations')
  @HttpCode(HttpStatus.CREATED)
  async refine(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: RefineBody,
  ): Promise<IterationResponse> {
    const useCase = new RefineProcessing(
      this.processingRepository,
      this.aiProvider,
    );
    const iteration = await useCase.execute({
      processingId: id,
      userId: user.id,
      refinement: typeof body.refinement === 'string' ? body.refinement : '',
    });
    return this.toIterationResponse(iteration);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    const useCase = new DeleteProcessing(this.processingRepository);
    await useCase.execute({ id, userId: user.id });
  }

  // Rota estatica declarada antes de :id para nao ser capturada pelo param.
  @Get('idea-search')
  async searchIdeas(
    @CurrentUser() user: AuthenticatedUser,
    @Query('term') termRaw?: string,
  ): Promise<
    { id: string; name: string; ideaTypeId: string; ideaTypeName: string }[]
  > {
    const term = (termRaw ?? '').slice(0, SEARCH_TERM_MAX);
    return this.processingRepository.searchIdeas({ userId: user.id, term });
  }

  @Get(':id')
  async findById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ProcessingDetailResponse> {
    const entity = await this.processingRepository.findById(id);
    if (!entity || entity.userId !== user.id) {
      throw new DomainError('processing.not_found', 404);
    }
    return this.toDetailResponse(entity);
  }

  @Get()
  async findPage(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') pageRaw?: string,
    @Query('pageSize') pageSizeRaw?: string,
  ): Promise<{
    items: {
      id: string;
      ideaId: string;
      ideaName: string;
      ideaTypeName: string;
      iterationsCount: number;
      createdAt: string;
      updatedAt: string;
    }[];
    page: number;
    perPage: number;
    total: number;
  }> {
    const page = Math.max(parseInt(pageRaw ?? '1', 10) || 1, 1);
    const perPage = Math.min(
      Math.max(parseInt(pageSizeRaw ?? '10', 10) || 10, 1),
      100,
    );
    const result = await this.processingRepository.findPage({
      userId: user.id,
      page,
      perPage,
    });
    return {
      items: result.items.map((item) => ({
        id: item.id,
        ideaId: item.ideaId,
        ideaName: item.ideaName,
        ideaTypeName: item.ideaTypeName,
        iterationsCount: item.iterationsCount,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      page: result.page,
      perPage: result.perPage,
      total: result.total,
    };
  }

  private toIterationResponse(
    iteration: ProcessingIteration,
  ): IterationResponse {
    return {
      id: iteration.id,
      refinement: iteration.refinement,
      result: iteration.result,
      position: iteration.position,
      createdAt: iteration.createdAt.toISOString(),
    };
  }

  // Nao expoe userId nem promptTemplate (detalhe interno do agregado).
  private toDetailResponse(entity: Processing): ProcessingDetailResponse {
    return {
      id: entity.id,
      ideaId: entity.ideaId,
      ideaName: entity.ideaName,
      ideaDescription: entity.ideaDescription,
      ideaObjective: entity.ideaObjective,
      ideaTypeId: entity.ideaTypeId,
      ideaTypeName: entity.ideaTypeName,
      resources: entity.resources.map((resource) => ({
        type: resource.type,
        content: resource.content,
        position: resource.position,
      })),
      iterations: entity.iterations.map((iteration) =>
        this.toIterationResponse(iteration),
      ),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
