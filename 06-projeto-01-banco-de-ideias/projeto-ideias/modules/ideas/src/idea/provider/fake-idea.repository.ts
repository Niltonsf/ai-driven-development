import { PageResult } from "@ideias/shared";
import { Idea, Resource } from "../model";
import {
  DailyCount,
  IdeaPageParams,
  IdeaRepository,
  IdeaSummary,
} from "./idea.repository";

function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function windowStart(days: number): number {
  const now = new Date();
  const startUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - (days - 1),
  );
  return startUtc;
}

export class FakeIdeaRepository implements IdeaRepository {
  private items: Idea[] = [];
  // ideaTypeName e dado do agregado vizinho; o fake o resolve por um seed
  // explicito alimentado pelos testes (mesmo padrao do ideaSearchSeed).
  public ideaTypeNameById = new Map<string, string>();

  async create(entity: Idea): Promise<Idea> {
    this.items.push(entity);
    return entity;
  }

  // Replace-all: a Idea persistida carrega a colecao final de recursos; o
  // estado anterior (e seus recursos) e integralmente substituido.
  async update(entity: Idea): Promise<Idea> {
    const index = this.items.findIndex((item) => item.id === entity.id);
    if (index === -1) {
      this.items.push(entity);
    } else {
      this.items[index] = entity;
    }
    return entity;
  }

  // A remocao em cascata dos recursos e responsabilidade da FK no banco; o
  // fake apenas descarta a Idea inteira, o que ja remove seus recursos.
  async delete(id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id !== id);
  }

  async findById(id: string): Promise<Idea | null> {
    const found = this.items.find((item) => item.id === id);
    if (!found) {
      return null;
    }
    const resources = [...found.resources].sort(this.compareResources);
    return found.clone({ resources, updatedAt: found.updatedAt });
  }

  // findPage nao carrega recursos para manter o payload da listagem enxuto;
  // o detalhe deve ser obtido via findById.
  async findPage(params: IdeaPageParams): Promise<PageResult<Idea>> {
    const filtered = this.items.filter(
      (item) => item.userId === params.userId,
    );
    const page = Math.max(params.page, 1);
    const perPage = Math.max(params.perPage, 1);
    const start = (page - 1) * perPage;
    const items = filtered
      .slice(start, start + perPage)
      .map((item) => item.clone({ resources: [], updatedAt: item.updatedAt }));
    return {
      items,
      page,
      perPage,
      total: filtered.length,
    };
  }

  async countByUser(userId: string): Promise<number> {
    return this.items.filter((item) => item.userId === userId).length;
  }

  async findLatestByUser(
    userId: string,
    limit: number,
  ): Promise<IdeaSummary[]> {
    return this.items
      .filter((item) => item.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit)
      .map((item) => ({
        id: item.id,
        name: item.name,
        ideaTypeId: item.ideaTypeId,
        ideaTypeName: this.ideaTypeNameById.get(item.ideaTypeId) ?? "",
        updatedAt: item.updatedAt,
      }));
  }

  async countDailyByUser(
    userId: string,
    days: number,
  ): Promise<DailyCount[]> {
    const start = windowStart(days);
    const counts = new Map<string, number>();
    for (const item of this.items) {
      if (item.userId !== userId) {
        continue;
      }
      if (item.createdAt.getTime() < start) {
        continue;
      }
      const key = utcDay(item.createdAt);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].map(([date, count]) => ({ date, count }));
  }

  private compareResources(a: Resource, b: Resource): number {
    if (a.position !== b.position) {
      return a.position - b.position;
    }
    return a.createdAt.getTime() - b.createdAt.getTime();
  }
}
