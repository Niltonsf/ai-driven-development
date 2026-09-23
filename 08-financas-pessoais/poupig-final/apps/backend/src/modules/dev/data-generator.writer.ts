import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { AccountType, SaveAccount, SaveAccountErrors } from '@poupig/account';
import {
  CardBrand,
  SaveCreditCard,
  SaveCreditCardErrors,
} from '@poupig/credit-card';
import {
  AccountBlueprint,
  CreditCardBlueprint,
  DevDataItemSummaryDTO,
  DevDataLinksDTO,
  PseudoRandom,
  SeriesDataPlanDTO,
  SeriesDataSummaryDTO,
  SeriesOccurrenceSummaryDTO,
  TransactionBlueprint,
  TransactionDataPlanDTO,
  TransactionDataSummaryDTO,
  createRandom,
} from '@poupig/dev';
import { Result } from '@poupig/shared';
import {
  Direction,
  RecurrenceScheduleCalculator,
  SaveScheduledTransaction,
  SaveScheduledTransactionErrors,
  SaveTransaction,
  SaveTransactionSeries,
  SeriesKind,
  TransactionStatus,
} from '@poupig/transaction';
import { AccountPrisma } from '../account/account.prisma';
import { CategoryPrisma } from '../category/category.prisma';
import { CreditCardPrisma } from '../credit-card/credit-card.prisma';
import { ScheduledTransactionPrisma } from '../transaction/scheduled-transaction.prisma';
import { TransactionPrisma } from '../transaction/transaction.prisma';
import { TransactionSeriesPrisma } from '../transaction/transaction-series.prisma';
import { InMemoryMovementReferences } from './in-memory-movement-references';

/** Page size used to walk the account and credit card listings. */
const LINKS_PAGE_SIZE = 100;

/** A record that generated data can point to. */
export type DataGeneratorLinkItem = { id: string; name: string };

/**
 * Records of the authenticated user that generated data links to.
 *
 * - `accounts` and `creditCards`: **active** records in listing order
 *   (creation ascending), so a plan position lands on the same record for the
 *   same data;
 * - `subcategories`: active subcategories of active categories;
 * - `accountNames` and `creditCardNames`: every non-deleted name, active or
 *   not — the names a new record can collide with;
 * - `counts`: the only thing the planner sees.
 */
export type DataGeneratorLinks = {
  accounts: DataGeneratorLinkItem[];
  creditCards: DataGeneratorLinkItem[];
  subcategories: DataGeneratorLinkItem[];
  accountNames: string[];
  creditCardNames: string[];
  counts: DevDataLinksDTO;
};

/** Ids a transaction blueprint resolves to. `null` means "nothing to link". */
export type ResolvedTransactionLinks = {
  accountId: string | null;
  creditCardId: string | null;
  subcategoryId: string | null;
};

type LinkRecord = { id: string; name: string; isActive: boolean };
type LinkPage = { items: LinkRecord[]; total: number };

/** Accent- and case-insensitive form of a name, used to match category hints. */
function normalizeName(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Smallest `"<name> n"` with `n >= 2` that is not among the known names. */
function nextAvailableName(name: string, knownNames: Set<string>): string {
  let suffix = 2;
  while (knownNames.has(`${name} ${suffix}`)) suffix += 1;
  return `${name} ${suffix}`;
}

function toLinkItem({
  id,
  name,
}: DataGeneratorLinkItem): DataGeneratorLinkItem {
  return { id, name };
}

/** A read the writer cannot work without: it propagates as a 500. */
function loadError(what: string, errors: string[]): Error {
  return new Error(
    `Data generator could not load ${what}: ${errors.join(', ')}`,
  );
}

/** Accumulates the outcome of one item; `errors` keeps the first occurrence order without repetition. */
class ItemSummary {
  private created = 0;
  private skipped = 0;
  private readonly errors = new Set<string>();

  constructor(private readonly requested: number) {}

  record(result: Result<unknown>): void {
    if (result.isFailure) {
      this.skipped += 1;
      result.errors.forEach((error) => this.errors.add(error));
      return;
    }
    this.created += 1;
  }

  toDTO(): DevDataItemSummaryDTO {
    return {
      requested: this.requested,
      created: this.created,
      skipped: this.skipped,
      errors: [...this.errors],
    };
  }
}

/** Accumulates the outcome of the occurrences of a run; `errors` keeps the first occurrence order without repetition. */
class OccurrenceSummary {
  private settled = 0;
  private pending = 0;
  private skipped = 0;
  private readonly errors = new Set<string>();

  /** `status` is the one the occurrence was written with; it only counts when the write succeeded. */
  record(result: Result<unknown>, status: TransactionStatus): void {
    if (result.isFailure) {
      this.skip(result.errors);
      return;
    }
    if (status === TransactionStatus.SETTLED) this.settled += 1;
    else this.pending += 1;
  }

  /** One occurrence that could not even be attempted (e.g. its series could not be read back). */
  skip(errors: string[]): void {
    this.skipped += 1;
    errors.forEach((error) => this.errors.add(error));
  }

  toDTO(): SeriesOccurrenceSummaryDTO {
    return {
      settled: this.settled,
      pending: this.pending,
      skipped: this.skipped,
      errors: [...this.errors],
    };
  }
}

/**
 * Composition layer of the data generator: the only place that knows both the
 * plan (`@poupig/dev`) and the use cases of the owning modules.
 *
 * Every record goes through its module's write use case, sequentially, so the
 * name checks of the use cases never race each other. A failure returned as a
 * `Result` is counted as skipped and never stops the run; a thrown exception
 * (database down, infrastructure bug) is not caught and propagates as a 500.
 */
@Injectable()
export class DataGeneratorWriter {
  constructor(
    private readonly accountPrisma: AccountPrisma,
    private readonly creditCardPrisma: CreditCardPrisma,
    private readonly categoryPrisma: CategoryPrisma,
    private readonly transactionPrisma: TransactionPrisma,
    private readonly transactionSeriesPrisma: TransactionSeriesPrisma,
    private readonly scheduledTransactionPrisma: ScheduledTransactionPrisma,
  ) {}

  /** Loads the records of the user that generated data can link to. */
  async loadLinks(userId: string): Promise<DataGeneratorLinks> {
    const categoriesResult =
      await this.categoryPrisma.findCategoriesByUserId.execute(userId);
    if (categoriesResult.isFailure) {
      throw loadError('categories', categoriesResult.errors);
    }

    const subcategories = categoriesResult.instance
      .filter((category) => category.isActive)
      .flatMap((category) =>
        category.subcategories.filter((subcategory) => subcategory.isActive),
      )
      .map(toLinkItem);

    return this.loadAccountsAndCreditCards(userId, subcategories);
  }

  /**
   * Resolves the positions and the category hint of a transaction blueprint.
   *
   * - account and credit card by position **modulo** the list: when a planned
   *   record was skipped the reloaded list is shorter than the planned count,
   *   and the position still lands on a real record;
   * - subcategory by accent- and case-insensitive name; without a match, one
   *   is drawn by `random`; with a `null` hint or no subcategory, `null`.
   *
   * `random` must be separate from the one that built the plan, so resolving
   * links never changes the plan of a seed.
   */
  resolveLinks(
    blueprint: Pick<
      TransactionBlueprint,
      'accountIndex' | 'creditCardIndex' | 'categoryHint'
    >,
    links: DataGeneratorLinks,
    random: PseudoRandom,
  ): ResolvedTransactionLinks {
    return {
      accountId: this.atPosition(links.accounts, blueprint.accountIndex),
      creditCardId:
        blueprint.creditCardIndex === null
          ? null
          : this.atPosition(links.creditCards, blueprint.creditCardIndex),
      subcategoryId: this.resolveSubcategory(
        blueprint.categoryHint,
        links.subcategories,
        random,
      ),
    };
  }

  /** Writes accounts → credit cards → transactions and summarizes the run. */
  async writeTransactionData(
    userId: string,
    plan: TransactionDataPlanDTO,
    links: DataGeneratorLinks,
  ): Promise<TransactionDataSummaryDTO> {
    const references = new InMemoryMovementReferences();
    references.setSubcategories(links.subcategories.map((item) => item.id));

    const accounts = await this.writeAccounts(
      userId,
      plan.accounts,
      links.accountNames,
    );
    const creditCards = await this.writeCreditCards(
      userId,
      plan.creditCards,
      links.creditCardNames,
    );

    // Transactions link to what existed before plus what this run just created.
    const current = await this.loadAccountsAndCreditCards(
      userId,
      links.subcategories,
    );
    references.replaceAccounts(current.accounts.map((item) => item.id));
    references.replaceCreditCards(current.creditCards.map((item) => item.id));

    const transactions = await this.writeTransactions(
      userId,
      plan,
      current,
      references,
    );

    return { accounts, creditCards, transactions, seed: plan.seed };
  }

  /**
   * Writes every planned series and, for each created one, its occurrences up
   * to the end of the current month (`plan.period.to`): before today `SETTLED`
   * on its own date, from today on `PENDING`. Occurrences of later months stay
   * generated on demand by the statement.
   */
  async writeSeriesData(
    userId: string,
    plan: SeriesDataPlanDTO,
    links: DataGeneratorLinks,
  ): Promise<SeriesDataSummaryDTO> {
    const references = new InMemoryMovementReferences();
    references.replaceAccounts(links.accounts.map((item) => item.id));
    references.replaceCreditCards(links.creditCards.map((item) => item.id));
    references.setSubcategories(links.subcategories.map((item) => item.id));

    // Recurrences are `OPEN` and installment plans `CLOSED`; one list, counted apart by `kind`.
    const closedCount = plan.series.filter(
      (blueprint) => SeriesKind[blueprint.kind] === SeriesKind.CLOSED,
    ).length;
    const recurrences = new ItemSummary(plan.series.length - closedCount);
    const installmentPlans = new ItemSummary(closedCount);
    const occurrences = new OccurrenceSummary();

    const saveSeries = new SaveTransactionSeries(
      this.transactionSeriesPrisma,
      references,
    );
    const saveOccurrence = new SaveScheduledTransaction(
      this.scheduledTransactionPrisma,
      this.scheduledTransactionPrisma.findScheduledTransactionByOccurrence,
      this.transactionSeriesPrisma.findTransactionSeriesById,
      references,
    );
    // Separate from the plan's generator: resolving links must not change the plan of a seed.
    const random = createRandom(plan.seed);

    for (const blueprint of plan.series) {
      const { accountId, creditCardId, subcategoryId } = this.resolveLinks(
        blueprint,
        links,
        random,
      );
      const kind = SeriesKind[blueprint.kind];
      // No `id`: the use case creates the series and computes the end date of a `CLOSED` one.
      const result = await saveSeries.execute({
        userId,
        name: blueprint.name,
        note: blueprint.note,
        value: blueprint.value,
        direction: Direction[blueprint.direction],
        // Same rule as the transactions: without an account the use case rejects it with its own code.
        accountId: accountId ?? '',
        creditCardId,
        subcategoryId,
        kind,
        recurrence: blueprint.recurrence,
        startDate: blueprint.startDate,
        installments: blueprint.installments,
      });
      const summary =
        kind === SeriesKind.CLOSED ? installmentPlans : recurrences;
      summary.record(result);

      // A rejected series has no occurrence to write.
      if (result.isFailure) continue;

      await this.writeOccurrences(
        userId,
        result.instance.id,
        plan,
        saveOccurrence,
        occurrences,
      );
    }

    return {
      recurrences: recurrences.toDTO(),
      installmentPlans: installmentPlans.toDTO(),
      occurrences: occurrences.toDTO(),
      seed: plan.seed,
    };
  }

  /**
   * Writes the occurrences of one created series up to `plan.period.to`.
   *
   * The occurrences are computed from the **saved** series, not from the
   * blueprint: its normalized rule and end date come from the entity, and
   * `SaveScheduledTransaction` recalculates `occurrenceOn` from the same source,
   * so the indexes never diverge. `plan.period.today` (not a new date) keeps
   * planning and writing on the same "today".
   */
  private async writeOccurrences(
    userId: string,
    seriesId: string,
    plan: SeriesDataPlanDTO,
    useCase: SaveScheduledTransaction,
    summary: OccurrenceSummary,
  ): Promise<void> {
    const seriesResult =
      await this.transactionSeriesPrisma.findTransactionSeriesById.execute(
        seriesId,
        userId,
      );
    if (seriesResult.isFailure) {
      summary.skip(seriesResult.errors);
      return;
    }

    const series = seriesResult.instance;
    if (!series) {
      summary.skip([
        SaveScheduledTransactionErrors.SCHEDULED_TRANSACTION_SERIES_NOT_FOUND,
      ]);
      return;
    }

    const dates = RecurrenceScheduleCalculator.occurrencesBetween(
      series.startDate,
      series.recurrence,
      {
        from: series.startDate,
        to: plan.period.to,
        endDate: series.endDate,
        installments: series.installments,
      },
    );

    for (const { index, date } of dates) {
      // `YYYY-MM-DD` strings compare as dates.
      const isPast = date < plan.period.today;
      const status = isPast
        ? TransactionStatus.SETTLED
        : TransactionStatus.PENDING;

      // Only through the use case, with the values the series has right now:
      // editing the series later does not reach occurrences already written.
      const result = await useCase.execute({
        seriesId: series.id,
        occurrenceIndex: index,
        userId,
        id: randomUUID(),
        name: series.name,
        note: series.note,
        value: series.value,
        direction: series.direction,
        accountId: series.accountId,
        creditCardId: series.creditCardId,
        subcategoryId: series.subcategoryId,
        status,
        expectedOn: date,
        settledOn: isPast ? date : null,
      });
      summary.record(result, status);
    }
  }

  private async writeAccounts(
    userId: string,
    blueprints: AccountBlueprint[],
    existingNames: string[],
  ): Promise<DevDataItemSummaryDTO> {
    const summary = new ItemSummary(blueprints.length);
    const knownNames = new Set(existingNames);
    const useCase = new SaveAccount(this.accountPrisma);

    for (const blueprint of blueprints) {
      const id = randomUUID();
      const result = await this.saveWithNameRetry(
        blueprint.name,
        knownNames,
        SaveAccountErrors.ACCOUNT_NAME_ALREADY_EXISTS,
        (name) =>
          useCase.execute({
            id,
            userId,
            name,
            // Indexing the enum by the literal breaks the build if the literal ever diverges.
            type: AccountType[blueprint.type],
            financialInstitution: blueprint.financialInstitution,
            icon: blueprint.icon,
            color: blueprint.color,
          }),
      );
      summary.record(result);
    }

    return summary.toDTO();
  }

  private async writeCreditCards(
    userId: string,
    blueprints: CreditCardBlueprint[],
    existingNames: string[],
  ): Promise<DevDataItemSummaryDTO> {
    const summary = new ItemSummary(blueprints.length);
    const knownNames = new Set(existingNames);
    const useCase = new SaveCreditCard(this.creditCardPrisma);

    for (const blueprint of blueprints) {
      const id = randomUUID();
      const result = await this.saveWithNameRetry(
        blueprint.name,
        knownNames,
        SaveCreditCardErrors.CREDIT_CARD_NAME_ALREADY_EXISTS,
        (name) =>
          useCase.execute({
            id,
            userId,
            name,
            brand: CardBrand[blueprint.brand],
            closingDay: blueprint.closingDay,
            dueDay: blueprint.dueDay,
            lastFourDigits: blueprint.lastFourDigits,
            limit: blueprint.limit,
            color: blueprint.color,
          }),
      );
      summary.record(result);
    }

    return summary.toDTO();
  }

  private async writeTransactions(
    userId: string,
    plan: TransactionDataPlanDTO,
    links: DataGeneratorLinks,
    references: InMemoryMovementReferences,
  ): Promise<DevDataItemSummaryDTO> {
    const summary = new ItemSummary(plan.transactions.length);
    const useCase = new SaveTransaction(this.transactionPrisma, references);
    // Separate from the plan's generator: resolving links must not change the plan of a seed.
    const random = createRandom(plan.seed);

    for (const blueprint of plan.transactions) {
      const { accountId, creditCardId, subcategoryId } = this.resolveLinks(
        blueprint,
        links,
        random,
      );
      const result = await useCase.execute({
        userId,
        name: blueprint.name,
        note: blueprint.note,
        value: blueprint.value,
        direction: Direction[blueprint.direction],
        // No account to link (every planned one was skipped and none existed):
        // the use case rejects it with its own code, which shows up in the summary.
        accountId: accountId ?? '',
        creditCardId,
        subcategoryId,
        status: TransactionStatus[blueprint.status],
        expectedOn: blueprint.expectedOn,
        settledOn: blueprint.settledOn,
      });
      summary.record(result);
    }

    return summary.toDTO();
  }

  /**
   * Saves once and, when the use case reports a name collision, tries **once**
   * more with the smallest free `"<name> n"` (`n >= 2`) among the names already
   * known — loaded before the run plus written by it.
   */
  private async saveWithNameRetry(
    name: string,
    knownNames: Set<string>,
    collisionCode: string,
    save: (name: string) => Promise<Result<void>>,
  ): Promise<Result<void>> {
    let savedName = name;
    let result = await save(savedName);

    if (result.isFailure && result.errors.includes(collisionCode)) {
      knownNames.add(name);
      savedName = nextAvailableName(name, knownNames);
      result = await save(savedName);
    }

    if (!result.isFailure) knownNames.add(savedName);
    return result;
  }

  private async loadAccountsAndCreditCards(
    userId: string,
    subcategories: DataGeneratorLinkItem[],
  ): Promise<DataGeneratorLinks> {
    const accounts = await this.loadAllPages('accounts', (page, pageSize) =>
      this.accountPrisma.findAccountsByUserId.execute(userId, page, pageSize),
    );
    const creditCards = await this.loadAllPages(
      'credit cards',
      (page, pageSize) =>
        this.creditCardPrisma.findCreditCardsByUserId.execute(
          userId,
          page,
          pageSize,
        ),
    );

    const activeAccounts = accounts
      .filter((record) => record.isActive)
      .map(toLinkItem);
    const activeCreditCards = creditCards
      .filter((record) => record.isActive)
      .map(toLinkItem);

    return {
      accounts: activeAccounts,
      creditCards: activeCreditCards,
      subcategories,
      accountNames: accounts.map((record) => record.name),
      creditCardNames: creditCards.map((record) => record.name),
      counts: {
        accountCount: activeAccounts.length,
        creditCardCount: activeCreditCards.length,
      },
    };
  }

  /** Walks a paginated listing until the accumulated items reach `total` (or a page comes back empty). */
  private async loadAllPages(
    what: string,
    fetchPage: (page: number, pageSize: number) => Promise<Result<LinkPage>>,
  ): Promise<LinkRecord[]> {
    const records: LinkRecord[] = [];
    let page = 1;
    let total = Number.POSITIVE_INFINITY;

    while (records.length < total) {
      const result = await fetchPage(page, LINKS_PAGE_SIZE);
      if (result.isFailure) throw loadError(what, result.errors);

      records.push(...result.instance.items);
      total = result.instance.total;
      if (result.instance.items.length === 0) break;
      page += 1;
    }

    return records;
  }

  private atPosition(
    list: DataGeneratorLinkItem[],
    index: number,
  ): string | null {
    if (list.length === 0) return null;
    return list[index % list.length].id;
  }

  private resolveSubcategory(
    hint: string | null,
    subcategories: DataGeneratorLinkItem[],
    random: PseudoRandom,
  ): string | null {
    if (hint === null || subcategories.length === 0) return null;

    const normalizedHint = normalizeName(hint);
    const match = subcategories.find(
      (subcategory) => normalizeName(subcategory.name) === normalizedHint,
    );
    return (match ?? random.pick(subcategories)).id;
  }
}
