import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DomainError, PageResult } from '@ideias/shared';
import {
  DailyCount,
  Idea,
  IdeaPageParams,
  IdeaRepository,
  IdeaSummary,
  Resource,
  ResourceType,
} from '@ideias/ideas';

// Inicio (00:00 UTC) de "hoje - (days - 1)". A janela do dashboard usa data
// UTC (simplificacao consciente do MVP; ajuste por fuso fica como evolucao).
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
import { PrismaService } from '../../db/prisma.service';

type PrismaIdea = {
  id: string;
  name: string;
  description: string;
  objective: string;
  ideaTypeId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type PrismaResource = {
  id: string;
  ideaId: string;
  type: string;
  content: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class IdeaPrismaRepository implements IdeaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: Idea): Promise<Idea> {
    await this.prisma.$transaction([
      this.prisma.idea.create({ data: this.toRow(entity) }),
      this.prisma.resource.createMany({
        data: entity.resources.map((resource) =>
          this.toResourceRow(resource, entity.id),
        ),
      }),
    ]);
    return (await this.findById(entity.id))!;
  }

  async update(entity: Idea): Promise<Idea> {
    await this.prisma.$transaction(async (tx) => {
      await tx.idea.update({
        where: { id: entity.id },
        data: this.toRow(entity),
      });

      const current = await tx.resource.findMany({
        where: { ideaId: entity.id },
        select: { id: true },
      });
      const currentIds = new Set(current.map((row) => row.id));
      const incomingIds = new Set(
        entity.resources.map((resource) => resource.id),
      );

      // Replace-all: tudo que existia e nao veio na colecao final e removido.
      await tx.resource.deleteMany({
        where: { ideaId: entity.id, id: { notIn: [...incomingIds] } },
      });

      for (const resource of entity.resources) {
        const row = this.toResourceRow(resource, entity.id);
        if (currentIds.has(resource.id)) {
          await tx.resource.update({
            where: { id: resource.id },
            data: {
              type: row.type,
              content: row.content,
              position: row.position,
            },
          });
        } else {
          await tx.resource.create({ data: row });
        }
      }
    });
    return (await this.findById(entity.id))!;
  }

  async delete(id: string): Promise<void> {
    // A FK resources.ideaId tem onDelete: Cascade, entao os recursos saem
    // junto com a Ideia sem logica adicional aqui. Ja processings.ideaId tem
    // onDelete: Restrict: apagar uma Ideia com Processamentos viola a FK
    // (Prisma P2003). Traduzimos para um DomainError 422 mapeado no i18n.
    try {
      await this.prisma.idea.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new DomainError('idea.has_processings', 422);
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Idea | null> {
    const data = await this.prisma.idea.findUnique({
      where: { id },
      include: {
        resources: {
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });
    if (!data) {
      return null;
    }
    return this.toEntity(data, data.resources);
  }

  // findPage NAO carrega recursos para manter o payload da listagem enxuto;
  // o detalhe (com recursos) e obtido via findById.
  async findPage(params: IdeaPageParams): Promise<PageResult<Idea>> {
    const skip = (params.page - 1) * params.perPage;
    const where = { userId: params.userId };
    const [items, total] = await Promise.all([
      this.prisma.idea.findMany({
        where,
        skip,
        take: params.perPage,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.idea.count({ where }),
    ]);
    return {
      items: items.map((item) => this.toEntity(item, [])),
      total,
      page: params.page,
      perPage: params.perPage,
    };
  }

  async countByUser(userId: string): Promise<number> {
    return this.prisma.idea.count({ where: { userId } });
  }

  async findLatestByUser(
    userId: string,
    limit: number,
  ): Promise<IdeaSummary[]> {
    const rows = await this.prisma.idea.findMany({
      where: { userId },
      include: { ideaType: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      ideaTypeId: row.ideaTypeId,
      ideaTypeName: row.ideaType.name,
      updatedAt: row.updatedAt,
    }));
  }

  // Agrupamento por dia de criacao em UTC. createdAt e armazenado em UTC
  // (timestamp sem fuso), entao date_trunc('day', ...) ja produz o dia UTC.
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
      FROM "ideas"
      WHERE "userId" = ${userId} AND "createdAt" >= ${start}
      GROUP BY 1
    `);
    return rows.map((row) => ({ date: row.date, count: Number(row.count) }));
  }

  private toRow(entity: Idea) {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      objective: entity.objective,
      ideaTypeId: entity.ideaTypeId,
      userId: entity.userId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
    };
  }

  private toResourceRow(resource: Resource, ideaId: string) {
    return {
      id: resource.id,
      ideaId,
      type: resource.type,
      content: resource.content,
      position: resource.position,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    };
  }

  private toEntity(data: PrismaIdea, resources: PrismaResource[]): Idea {
    return new Idea({
      id: data.id,
      name: data.name,
      description: data.description,
      objective: data.objective,
      ideaTypeId: data.ideaTypeId,
      userId: data.userId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
      resources: resources.map((row) => this.toResource(row)),
    });
  }

  private toResource(row: PrismaResource): Resource {
    return new Resource({
      id: row.id,
      type: row.type as ResourceType,
      content: row.content,
      position: row.position,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
