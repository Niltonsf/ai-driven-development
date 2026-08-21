import { PageResult } from "@ideias/shared";
import { DailyCount } from "../../idea/provider/idea.repository";
import { Processing, ProcessingIteration } from "../model";
import {
  IdeaSearchParams,
  IdeaSearchResult,
  ProcessingPageParams,
  ProcessingRepository,
  ProcessingSummary,
} from "./processing.repository";

function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function windowStart(days: number): number {
  const now = new Date();
  return Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - (days - 1),
  );
}

export class FakeProcessingRepository implements ProcessingRepository {
  private items: Processing[] = [];
  // searchIdeas depende de dados da Ideia (agregado vizinho), entao no fake a
  // base de busca e semeada explicitamente pelos testes/controllers.
  public ideaSearchSeed: { userId: string; item: IdeaSearchResult }[] = [];

  async create(entity: Processing): Promise<Processing> {
    this.items.push(entity);
    return entity;
  }

  async appendIteration(
    processingId: string,
    iteration: ProcessingIteration,
  ): Promise<void> {
    const current = this.items.find((item) => item.id === processingId);
    if (!current) {
      return;
    }
    const index = this.items.indexOf(current);
    this.items[index] = current.clone({
      iterations: [...current.iterations, iteration],
      updatedAt: current.updatedAt,
    });
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id !== id);
  }

  async findById(id: string): Promise<Processing | null> {
    const found = this.items.find((item) => item.id === id);
    if (!found) {
      return null;
    }
    const iterations = [...found.iterations].sort(
      (a, b) => a.position - b.position,
    );
    const resources = [...found.resources].sort(
      (a, b) => a.position - b.position,
    );
    return found.clone({
      iterations,
      resources,
      updatedAt: found.updatedAt,
    });
  }

  async findPage(
    params: ProcessingPageParams,
  ): Promise<PageResult<ProcessingSummary>> {
    const filtered = this.items
      .filter((item) => item.userId === params.userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    const page = Math.max(params.page, 1);
    const perPage = Math.max(params.perPage, 1);
    const start = (page - 1) * perPage;
    const items = filtered
      .slice(start, start + perPage)
      .map((item) => this.toSummary(item));
    return {
      items,
      page,
      perPage,
      total: filtered.length,
    };
  }

  async searchIdeas({
    userId,
    term,
  }: IdeaSearchParams): Promise<IdeaSearchResult[]> {
    const normalized = term.trim().toLowerCase();
    return this.ideaSearchSeed
      .filter((entry) => entry.userId === userId)
      .filter(
        (entry) =>
          normalized.length === 0 ||
          entry.item.name.toLowerCase().includes(normalized) ||
          entry.item.ideaTypeName.toLowerCase().includes(normalized),
      )
      .slice(0, 20)
      .map((entry) => entry.item);
  }

  async countByUser(userId: string): Promise<number> {
    return this.items.filter((item) => item.userId === userId).length;
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

  private toSummary(item: Processing): ProcessingSummary {
    return {
      id: item.id,
      ideaId: item.ideaId,
      ideaName: item.ideaName,
      ideaTypeName: item.ideaTypeName,
      iterationsCount: item.iterations.length,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
