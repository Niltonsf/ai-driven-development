import { Controller, Get, Query } from '@nestjs/common';
import { LoadDashboardSummary } from '@ideias/ideas';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../shared/types/current-user.type';
import { IdeaPrismaRepository } from './idea.prisma';
import { IdeaTypePrismaRepository } from './idea-type.prisma';
import { ProcessingPrismaRepository } from './processing.prisma';

interface DashboardSummaryResponse {
  stats: {
    ideasCount: number;
    ideaTypesCount: number;
    processingsCount: number;
  };
  latestIdeas: {
    id: string;
    name: string;
    ideaTypeId: string;
    ideaTypeName: string;
    updatedAt: string;
  }[];
  activity: {
    date: string;
    ideasCreated: number;
    processingsExecuted: number;
  }[];
}

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly ideaRepository: IdeaPrismaRepository,
    private readonly ideaTypeRepository: IdeaTypePrismaRepository,
    private readonly processingRepository: ProcessingPrismaRepository,
  ) {}

  @Get('summary')
  async summary(
    @CurrentUser() user: AuthenticatedUser,
    @Query('latestLimit') latestLimitRaw?: string,
  ): Promise<DashboardSummaryResponse> {
    const useCase = new LoadDashboardSummary(
      this.ideaRepository,
      this.ideaTypeRepository,
      this.processingRepository,
    );
    // Quando ausente, deixa o caso de uso aplicar o default (5). Quando
    // presente, repassa o number cru (NaN/fora de faixa) para o caso de uso
    // validar — sem duplicar a regra aqui.
    const summary = await useCase.execute({
      userId: user.id,
      latestLimit:
        latestLimitRaw === undefined ? undefined : Number(latestLimitRaw),
    });
    return {
      stats: summary.stats,
      latestIdeas: summary.latestIdeas.map((idea) => ({
        id: idea.id,
        name: idea.name,
        ideaTypeId: idea.ideaTypeId,
        ideaTypeName: idea.ideaTypeName,
        updatedAt: idea.updatedAt.toISOString(),
      })),
      activity: summary.activity,
    };
  }
}
