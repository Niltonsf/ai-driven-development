import { DomainError, UseCase } from "@ideias/shared";
import { IdeaRepository } from "../../idea/provider";
import { IdeaTypeRepository } from "../../idea-type/provider";
import { ProcessingRepository } from "../../processing/provider";
import { DashboardActivityPoint, DashboardSummary } from "../model";

export interface LoadDashboardSummaryIn {
  userId: string;
  latestLimit?: number;
}

const DEFAULT_LATEST_LIMIT = 5;
const MIN_LATEST_LIMIT = 1;
const MAX_LATEST_LIMIT = 20;

// Janela do grafico de atividade. Fixa por decisao de produto (spec 012):
// sem query string, sem filtro de periodo nesta versao.
const ACTIVITY_WINDOW_DAYS = 7;

export class LoadDashboardSummary
  implements UseCase<LoadDashboardSummaryIn, DashboardSummary>
{
  constructor(
    private readonly ideaRepository: IdeaRepository,
    private readonly ideaTypeRepository: IdeaTypeRepository,
    private readonly processingRepository: ProcessingRepository,
  ) {}

  async execute(input: LoadDashboardSummaryIn): Promise<DashboardSummary> {
    const limit = input.latestLimit ?? DEFAULT_LATEST_LIMIT;

    if (
      !Number.isInteger(limit) ||
      limit < MIN_LATEST_LIMIT ||
      limit > MAX_LATEST_LIMIT
    ) {
      throw new DomainError("dashboard.latestLimit.invalid", 422);
    }

    // As 6 leituras sao disparadas juntas (Promise.all avalia o array antes
    // de qualquer await), aproveitando os repositorios ja existentes.
    const [
      ideasCount,
      ideaTypesCount,
      processingsCount,
      latestIdeas,
      ideaDaily,
      processingDaily,
    ] = await Promise.all([
      this.ideaRepository.countByUser(input.userId),
      this.ideaTypeRepository.countByUser(input.userId),
      this.processingRepository.countByUser(input.userId),
      this.ideaRepository.findLatestByUser(input.userId, limit),
      this.ideaRepository.countDailyByUser(input.userId, ACTIVITY_WINDOW_DAYS),
      this.processingRepository.countDailyByUser(
        input.userId,
        ACTIVITY_WINDOW_DAYS,
      ),
    ]);

    const ideasByDate = new Map(ideaDaily.map((d) => [d.date, d.count]));
    const processingsByDate = new Map(
      processingDaily.map((d) => [d.date, d.count]),
    );

    const activity: DashboardActivityPoint[] = this.buildDateSlots(
      ACTIVITY_WINDOW_DAYS,
    ).map((date) => ({
      date,
      ideasCreated: ideasByDate.get(date) ?? 0,
      processingsExecuted: processingsByDate.get(date) ?? 0,
    }));

    return {
      stats: { ideasCount, ideaTypesCount, processingsCount },
      latestIdeas: latestIdeas.map((idea) => ({
        id: idea.id,
        name: idea.name,
        ideaTypeId: idea.ideaTypeId,
        ideaTypeName: idea.ideaTypeName,
        updatedAt: idea.updatedAt,
      })),
      activity,
    };
  }

  // Hoje e os (days-1) dias anteriores, em UTC, ordem ascendente. Garante que
  // o grafico sempre tem exatamente `days` pontos, sem buracos.
  private buildDateSlots(days: number): string[] {
    const now = new Date();
    const slots: string[] = [];
    for (let offset = days - 1; offset >= 0; offset--) {
      const day = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() - offset,
        ),
      );
      slots.push(day.toISOString().slice(0, 10));
    }
    return slots;
  }
}
