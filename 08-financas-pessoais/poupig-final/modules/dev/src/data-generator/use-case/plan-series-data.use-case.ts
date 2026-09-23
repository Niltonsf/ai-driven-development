import { Result, UseCase } from '@poupig/shared';
import { DEV_DATA_LIMITS } from '../constants';
import { DevDataErrors } from '../dev-data.errors';
import { DevDataLinksDTO, SeriesDataPlanDTO, SeriesDataRequestDTO } from '../dto';
import { DevDataPlanner, SeedSource, createRandom } from '../model';

export type PlanSeriesDataInput = {
  /** `months` may be absent here: an absent period is a validation failure (`INVALID_DEV_DATA_PERIOD`), not a type error. */
  request: Omit<SeriesDataRequestDTO, 'months'> & { months?: number };
  /** `YYYY-MM-DD`, in UTC. */
  today: string;
  /** Accounts and credit cards the user already has; this generator creates neither. */
  links: DevDataLinksDTO;
};

/**
 * Validates a series data request and describes the recurrences and installment
 * plans that should be created. Nothing is persisted: the plan is the product.
 */
export class PlanSeriesData implements UseCase<PlanSeriesDataInput, SeriesDataPlanDTO> {
  /** @param seedSource draws the seed when the request has none (kept outside the domain). */
  constructor(private readonly seedSource: SeedSource) {}

  async execute({ request, today, links }: PlanSeriesDataInput): Promise<Result<SeriesDataPlanDTO>> {
    const formatErrors = this.formatErrors(request);
    if (formatErrors.length) return Result.fail(formatErrors);

    if (links.accountCount === 0) {
      return Result.fail(DevDataErrors.DEV_DATA_ACCOUNT_REQUIRED);
    }

    const months = request.months as number;
    const seed = request.seed ?? this.seedSource();
    const random = createRandom(seed);

    // Reproducibility contract: the single `random` is consumed in this fixed order
    // (period → series, recurrences before installment plans). Changing the order changes
    // the plan of an already shared seed, and "same seed, same plan" tests do not catch it.
    const period = DevDataPlanner.periodOf(months, today);
    const series = DevDataPlanner.planTransactionSeries(
      request.recurrences,
      request.installmentPlans,
      period,
      links,
      random,
    );

    return Result.ok({ series, seed, period });
  }

  /** Format rules, accumulated without repetition. */
  private formatErrors(request: PlanSeriesDataInput['request']): string[] {
    const errors = new Set<string>();
    const { recurrences, installmentPlans, months, seed } = request;

    if (!(recurrences > 0) && !(installmentPlans > 0)) {
      errors.add(DevDataErrors.INVALID_DEV_DATA_REQUEST);
    }

    const quantities: [number, number][] = [
      [recurrences, DEV_DATA_LIMITS.maxRecurrences],
      [installmentPlans, DEV_DATA_LIMITS.maxInstallmentPlans],
    ];
    for (const [quantity, max] of quantities) {
      if (!Number.isInteger(quantity) || quantity < 0 || quantity > max) {
        errors.add(DevDataErrors.INVALID_DEV_DATA_QUANTITY);
      }
    }

    if (months === undefined || !Number.isInteger(months) || months < 1 || months > DEV_DATA_LIMITS.maxMonths) {
      errors.add(DevDataErrors.INVALID_DEV_DATA_PERIOD);
    }

    if (seed !== undefined && !Number.isSafeInteger(seed)) {
      errors.add(DevDataErrors.INVALID_DEV_DATA_SEED);
    }

    return [...errors];
  }
}
