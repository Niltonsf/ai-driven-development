import { Injectable } from '@nestjs/common';
import { PageResult } from '@ideias/shared';
import { User, UserPageParams, UserRepository } from '@ideias/auth';
import { PrismaService } from '../../db/prisma.service';

type PrismaUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

@Injectable()
export class UserPrismaRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: User): Promise<User> {
    const data = await this.prisma.user.create({
      data: this.toPersistence(entity),
    });
    return this.toDomain(data);
  }

  async update(entity: User): Promise<User> {
    const data = await this.prisma.user.update({
      where: { id: entity.id },
      data: this.toPersistence(entity),
    });
    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async findById(id: string): Promise<User | null> {
    const data = await this.prisma.user.findUnique({ where: { id } });
    return data ? this.toDomain(data) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const data = await this.prisma.user.findUnique({ where: { email } });
    return data ? this.toDomain(data) : null;
  }

  async findPage(params: UserPageParams): Promise<PageResult<User>> {
    const skip = (params.page - 1) * params.perPage;
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({ skip, take: params.perPage }),
      this.prisma.user.count(),
    ]);
    return {
      items: items.map((item) => this.toDomain(item)),
      total,
      page: params.page,
      perPage: params.perPage,
    };
  }

  private toPersistence(entity: User) {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      password: entity.password,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
    };
  }

  private toDomain(data: PrismaUser): User {
    return new User({
      id: data.id,
      name: data.name,
      email: data.email,
      password: data.password,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
    });
  }
}
