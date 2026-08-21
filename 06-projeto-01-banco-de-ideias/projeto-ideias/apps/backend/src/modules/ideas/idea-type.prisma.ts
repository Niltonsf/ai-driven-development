import { Injectable } from '@nestjs/common';
import { PageResult } from '@ideias/shared';
import {
  IdeaType,
  IdeaTypePageParams,
  IdeaTypeRepository,
} from '@ideias/ideas';
import { PrismaService } from '../../db/prisma.service';

type PrismaIdeaType = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

@Injectable()
export class IdeaTypePrismaRepository implements IdeaTypeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: IdeaType): Promise<IdeaType> {
    const data = await this.prisma.ideaType.create({
      data: this.toPersistence(entity),
    });
    return this.toDomain(data);
  }

  async update(entity: IdeaType): Promise<IdeaType> {
    const data = await this.prisma.ideaType.update({
      where: { id: entity.id },
      data: this.toPersistence(entity),
    });
    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.ideaType.delete({ where: { id } });
  }

  async findById(id: string): Promise<IdeaType | null> {
    const data = await this.prisma.ideaType.findUnique({ where: { id } });
    return data ? this.toDomain(data) : null;
  }

  async countByUser(userId: string): Promise<number> {
    return this.prisma.ideaType.count({ where: { userId } });
  }

  async findPage(params: IdeaTypePageParams): Promise<PageResult<IdeaType>> {
    const skip = (params.page - 1) * params.perPage;
    const where = { userId: params.userId };
    const [items, total] = await Promise.all([
      this.prisma.ideaType.findMany({
        where,
        skip,
        take: params.perPage,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.ideaType.count({ where }),
    ]);
    return {
      items: items.map((item) => this.toDomain(item)),
      total,
      page: params.page,
      perPage: params.perPage,
    };
  }

  private toPersistence(entity: IdeaType) {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      prompt: entity.prompt,
      userId: entity.userId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
    };
  }

  private toDomain(data: PrismaIdeaType): IdeaType {
    return new IdeaType({
      id: data.id,
      name: data.name,
      description: data.description,
      prompt: data.prompt,
      userId: data.userId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
    });
  }
}
