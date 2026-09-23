import { Result, UseCase } from '@poupig/shared';
import { DEV_DATA_LIMITS } from '../constants';
import { DevDataErrors } from '../dev-data.errors';
import { DevDataLinksDTO, TransactionDataPlanDTO, TransactionDataRequestDTO } from '../dto';
import { DevDataPlanner, SeedSource, createRandom } from '../model';

export type PlanTransactionDataInput = {
  /** `months` may be absent here: an absent period is a validation failure (`INVALID_DEV_DATA_PERIOD`), not a type error. */
  request: Omit<TransactionDataRequestDTO, 'months'> & { months?: number };
  /** `YYYY-MM-DD`, in UTC. */
  today: string;
  /** Accounts and credit cards the user already has. */
  links: DevDataLinksDTO;
};

/**
 * Validates a one-off transaction data request and describes what should be
 * created. Nothing is persisted: the plan is the product.
 */
export class PlanTransactionData implements UseCase<PlanTransactionDataInput, TransactionDataPlanDTO> {
  /** @param seedSource draws the seed when the request has none (kept outside the domain). */
  constructor(private readonly seedSource: SeedSource) {}

  async execute({ request, today, links }: PlanTransactionDataInput): Promise<Result<TransactionDataPlanDTO>> {
    const formatErrors = this.formatErrors(request);
    if (formatErrors.length) return Result.fail(formatErrors);

    if (request.transactions > 0 && links.accountCount === 0 && request.accounts === 0) {
      return Result.fail(DevDataErrors.DEV_DATA_ACCOUNT_REQUIRED);
    }

    const months = request.months as number;
    const seed = request.seed ?? this.seedSource();
    const random = createRandom(seed);

    // Reproducibility contract: the single `random` is consumed in this fixed order
    // (period → accounts → credit cards → transactions). Changing the order changes
    // the plan of an already shared seed, and "same seed, same plan" tests do not catch it.
    const period = DevDataPlanner.periodOf(months, today);
    const accounts = DevDataPlanner.planAccounts(request.accounts, random);
    const creditCards = DevDataPlanner.planCreditCards(request.creditCards, random);
    const transactions = DevDataPlanner.planTransactions(
      request.transactions,
      period,
      {
        accountCount: links.accountCount + request.accounts,
        creditCardCount: links.creditCardCount + request.creditCards,
      },
      random,
    );

    return Result.ok({ accounts, creditCards, transactions, seed, period });
  }

  /** Format rules, accumulated without repetition. */
  private formatErrors(request: PlanTransactionDataInput['request']): string[] {
    const errors = new Set<string>();
    const { accounts, creditCards, transactions, months, seed } = request;

    if (!(accounts > 0) && !(creditCards > 0) && !(transactions > 0)) {
      errors.add(DevDataErrors.INVALID_DEV_DATA_REQUEST);
    }

    const quantities: [number, number][] = [
      [accounts, DEV_DATA_LIMITS.maxAccounts],
      [creditCards, DEV_DATA_LIMITS.maxCreditCards],
      [transactions, DEV_DATA_LIMITS.maxTransactions],
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
