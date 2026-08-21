import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PageResult } from '@ideias/shared';
import {
  DailyCount,
  IdeaSearchParams,
  IdeaSearchResult,
  Processing,
  ProcessingIteration,
  ProcessingPageParams,
  ProcessingRepository,
  ProcessingResource,
  ProcessingSummary,
  ResourceType,
} from '@ideias/ideas';
import { PrismaService } from '../../db/prisma.service';

function utcWindowStart(days: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - (days - 1),
    ),
  );
}

type PrismaProcessing = {
  id: string;
  userId: string;
  ideaId: string;
  ideaName: string;
  ideaDescription: string;
  ideaObjective: string;
  ideaTypeId: string;
  ideaTypeName: string;
  promptTemplate: string;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaIteration = {
  id: string;
  refinement: string | null;
  result: string;
  position: number;
  createdAt: Date;
};

type PrismaResource = {
  type: string;
  content: string;
  position: number;
};

const SEARCH_LIMIT = 20;

@Injectable()
export class ProcessingPrismaRepository implements ProcessingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: Processing): Promise<Processing> {
    await this.prisma.$transaction([
      this.prisma.processing.create({ data: this.toProcessingRow(entity) }),
      this.prisma.processingIteration.createMany({
        data: entity.iterations.map((iteration) =>
          this.toIterationRow(iteration, entity.id),
        ),
      }),
      this.prisma.processingResource.createMany({
        data: entity.resources.map((resource) =>
          this.toResourceRow(resource, entity.id),
        ),
      }),
    ]);
    return (await this.findById(entity.id))!;
  }

  // Operacao atomica unica: insere uma linha sem tocar nas iteracoes
  // anteriores. Nao precisa de transacao.
  async appendIteration(
    processingId: string,
    iteration: ProcessingIteration,
  ): Promise<void> {
    await this.prisma.processingIteration.create({
      data: this.toIterationRow(iteration, processingId),
    });
  }

  async delete(id: string): Promise<void> {
    // Iteracoes e recursos saem em cascata pelas FKs (onDelete: Cascade).
    await this.prisma.processing.delete({ where: { id } });
  }

  async findById(id: string): Promise<Processing | null> {
    const data = await this.prisma.processing.findUnique({
      where: { id },
      include: {
        iterations: { orderBy: { position: 'asc' } },
        resources: { orderBy: { position: 'asc' } },
      },
    });
    if (!data) {
      return null;
    }
    return this.toEntity(data, data.iterations, data.resources);
  }

  // Listagem enxuta: nao carrega iteracoes/recursos, apenas a contagem.
  async findPage(
    params: ProcessingPageParams,
  ): Promise<PageResult<ProcessingSummary>> {
    const skip = (params.page - 1) * params.perPage;
    const where = { userId: params.userId };
    const [items, total] = await Promise.all([
      this.prisma.processing.findMany({
        where,
        skip,
        take: params.perPage,
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { iterations: true } } },
      }),
      this.prisma.processing.count({ where }),
    ]);
    return {
      items: items.map((item) => ({
        id: item.id,
        ideaId: item.ideaId,
        ideaName: item.ideaName,
        ideaTypeName: item.ideaTypeName,
        iterationsCount: item._count.iterations,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      total,
      page: params.page,
      perPage: params.perPage,
    };
  }

  async searchIdeas({
    userId,
    term,
  }: IdeaSearchParams): Promise<IdeaSearchResult[]> {
    const trimmed = term.trim();
    const where = trimmed
      ? {
          userId,
          OR: [
            { name: { contains: trimmed, mode: 'insensitive' as const } },
            {
              ideaType: {
                is: {
                  name: { contains: trimmed, mode: 'insensitive' as const },
                },
              },
            },
          ],
        }
      : { userId };

    const ideas = await this.prisma.idea.findMany({
      where,
      include: { ideaType: true },
      take: SEARCH_LIMIT,
      orderBy: { updatedAt: 'desc' },
    });

    return ideas.map((idea) => ({
      id: idea.id,
      name: idea.name,
      ideaTypeId: idea.ideaTypeId,
      ideaTypeName: idea.ideaType.name,
    }));
  }

  async countByUser(userId: string): Promise<number> {
    return this.prisma.processing.count({ where: { userId } });
  }

  // Mesma tecnica do daily de Idea: agrupa por dia de createdAt em UTC.
  async countDailyByUser(
    userId: string,
    days: number,
  ): Promise<DailyCount[]> {
    const start = utcWindowStart(days);
    const rows = await this.prisma.$queryRaw<
      { date: string; count: number }[]
    >(Prisma.sql`
      SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS date,
             COUNT(*)::int AS count
      FROM "processings"
      WHERE "userId" = ${userId} AND "createdAt" >= ${start}
      GROUP BY 1
    `);
    return rows.map((row) => ({ date: row.date, count: Number(row.count) }));
  }

  private toProcessingRow(entity: Processing) {
    return {
      id: entity.id,
      userId: entity.userId,
      ideaId: entity.ideaId,
      ideaName: entity.ideaName,
      ideaDescription: entity.ideaDescription,
      ideaObjective: entity.ideaObjective,
      ideaTypeId: entity.ideaTypeId,
      ideaTypeName: entity.ideaTypeName,
      promptTemplate: entity.promptTemplate,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toIterationRow(iteration: ProcessingIteration, processingId: string) {
    return {
      id: iteration.id,
      processingId,
      refinement: iteration.refinement,
      result: iteration.result,
      position: iteration.position,
      createdAt: iteration.createdAt,
    };
  }

  private toResourceRow(resource: ProcessingResource, processingId: string) {
    return {
      processingId,
      type: resource.type,
      content: resource.content,
      position: resource.position,
    };
  }

  private toEntity(
    data: PrismaProcessing,
    iterations: PrismaIteration[],
    resources: PrismaResource[],
  ): Processing {
    return new Processing({
      id: data.id,
      userId: data.userId,
      ideaId: data.ideaId,
      ideaName: data.ideaName,
      ideaDescription: data.ideaDescription,
      ideaObjective: data.ideaObjective,
      ideaTypeId: data.ideaTypeId,
      ideaTypeName: data.ideaTypeName,
      promptTemplate: data.promptTemplate,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      resources: resources.map((row) => this.toResource(row)),
      iterations: iterations.map((row) => this.toIteration(row)),
    });
  }

  private toIteration(row: PrismaIteration): ProcessingIteration {
    return new ProcessingIteration({
      id: row.id,
      refinement: row.refinement,
      result: row.result,
      position: row.position,
      createdAt: row.createdAt,
    });
  }

  private toResource(row: PrismaResource): ProcessingResource {
    return {
      type: row.type as ResourceType,
      content: row.content,
      position: row.position,
    };
  }
}
