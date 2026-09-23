import {
  ACCOUNTS_CATALOG,
  CREDIT_CARDS_CATALOG,
  INSTALLMENT_PLANS_CATALOG,
  ONE_OFF_CATALOG,
  OneOffTemplate,
  RECURRENCES_CATALOG,
  RecurrenceTemplate,
} from '../catalog';
import {
  AccountBlueprint,
  CreditCardBlueprint,
  DevDataLinksDTO,
  DevDataPeriodDTO,
  DirectionLiteral,
  RecurrenceRuleBlueprint,
  TransactionBlueprint,
  TransactionSeriesBlueprint,
} from '../dto';
import { PseudoRandom } from './pseudo-random';

/** One calendar month of a period; `month` is 1-based. */
export type DevDataMonth = {
  year: number;
  month: number;
  lastDay: number;
};

/** Share of income among the planned transactions (the spec caps it at 20%). */
const INCOME_RATIO = 0.15;

/** Probability of an expense being charged to a credit card, when there is one. */
const CREDIT_CARD_RATIO = 0.35;

/** Probability of an expense series being charged to a credit card, when there is one. */
const SERIES_CREDIT_CARD_RATIO = 0.3;

/**
 * Highest planned day of month: days 29..31 do not exist in every month, and
 * avoiding them keeps every occurrence on the same day without the month-end clamp.
 */
const MAX_PLANNED_DAY_OF_MONTH = 28;

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Pure planning rules of the data generator. It only **describes** what should
 * be created (blueprints); it never persists and never sees ids.
 * Dates are `YYYY-MM-DD` strings computed in UTC, without any timezone shift.
 */
export class DevDataPlanner {
  /** From the first day of the month `months - 1` before today's month to the last day of today's month. */
  static periodOf(months: number, today: string): DevDataPeriodDTO {
    const { year, month } = DevDataPlanner.parseDate(today);
    const monthIndex = month - 1;

    // `Date.UTC` normalizes negative months and day 0, covering year turns and leap years.
    const from = new Date(Date.UTC(year, monthIndex - (months - 1), 1));
    const to = new Date(Date.UTC(year, monthIndex + 1, 0));

    return {
      from: DevDataPlanner.formatUtcDate(from),
      to: DevDataPlanner.formatUtcDate(to),
      today,
    };
  }

  /** Months of the period in chronological order. */
  static monthsOf(period: DevDataPeriodDTO): DevDataMonth[] {
    const from = DevDataPlanner.parseDate(period.from);
    const to = DevDataPlanner.parseDate(period.to);
    const firstOffset = from.year * 12 + (from.month - 1);
    const lastOffset = to.year * 12 + (to.month - 1);

    const months: DevDataMonth[] = [];
    for (let offset = firstOffset; offset <= lastOffset; offset++) {
      const year = Math.floor(offset / 12);
      const month = (offset % 12) + 1;
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      months.push({ year, month, lastDay });
    }
    return months;
  }

  /** `quantity` distinct accounts from the catalog. */
  static planAccounts(quantity: number, random: PseudoRandom): AccountBlueprint[] {
    return random
      .shuffle(ACCOUNTS_CATALOG)
      .slice(0, quantity)
      .map((entry) => ({
        name: entry.name,
        type: entry.type,
        financialInstitution: entry.financialInstitution,
        icon: entry.icon,
        color: entry.color,
      }));
  }

  /** `quantity` distinct credit cards from the catalog, with limit in cents. */
  static planCreditCards(quantity: number, random: PseudoRandom): CreditCardBlueprint[] {
    return random
      .shuffle(CREDIT_CARDS_CATALOG)
      .slice(0, quantity)
      .map((entry) => {
        const { closingDay, dueDay } = random.pick(entry.billingDays);
        const lastFourDigits = String(random.int(0, 9999)).padStart(4, '0');
        const limit = random.int(entry.limitRange.min, entry.limitRange.max) * 100;

        return {
          name: entry.name,
          brand: entry.brand,
          closingDay,
          dueDay,
          lastFourDigits,
          limit,
          color: entry.color,
        };
      });
  }

  /**
   * `quantity` one-off transactions spread over the period, sorted by `expectedOn`.
   * `links` must have at least one account when `quantity > 0`.
   */
  static planTransactions(
    quantity: number,
    period: DevDataPeriodDTO,
    links: DevDataLinksDTO,
    random: PseudoRandom,
  ): TransactionBlueprint[] {
    const incomeCount = Math.floor(quantity * INCOME_RATIO);
    const directions = random.shuffle<DirectionLiteral>([
      ...Array.from({ length: incomeCount }, (): DirectionLiteral => 'IN'),
      ...Array.from({ length: Math.max(quantity - incomeCount, 0) }, (): DirectionLiteral => 'OUT'),
    ]);

    // From the current month back to the oldest: transaction `i` falls in month `i % months`,
    // so the current month always gets one and every month gets one when `quantity >= months`.
    const months = DevDataPlanner.monthsOf(period).reverse();
    const templates: Record<DirectionLiteral, readonly OneOffTemplate[]> = {
      IN: ONE_OFF_CATALOG.filter((template) => template.direction === 'IN'),
      OUT: ONE_OFF_CATALOG.filter((template) => template.direction === 'OUT'),
    };

    const blueprints = directions.map((direction, i): TransactionBlueprint => {
      const month = months[i % months.length] as DevDataMonth;
      const day = random.int(1, month.lastDay);
      const expectedOn = DevDataPlanner.formatDate(month.year, month.month, day);

      const template = random.weightedPick(templates[direction], (item) => item.weight);
      const value =
        random.int(Math.round(template.valueRange.min * 100), Math.round(template.valueRange.max * 100)) / 100;

      const accountIndex = random.int(0, links.accountCount - 1);
      const creditCardIndex =
        direction === 'OUT' && links.creditCardCount > 0 && random.chance(CREDIT_CARD_RATIO)
          ? random.int(0, links.creditCardCount - 1)
          : null;

      // Lexicographic comparison is valid for `YYYY-MM-DD`.
      const isPast = expectedOn < period.today;

      return {
        name: template.name,
        value,
        direction,
        expectedOn,
        status: isPast ? 'SETTLED' : 'PENDING',
        settledOn: isPast ? expectedOn : null,
        note: null,
        categoryHint: template.categoryHint,
        accountIndex,
        creditCardIndex,
      };
    });

    // `Array.prototype.sort` is stable: same-day transactions keep their generation order.
    return blueprints.sort((a, b) => (a.expectedOn < b.expectedOn ? -1 : a.expectedOn > b.expectedOn ? 1 : 0));
  }

  /**
   * `recurrences` open series followed by `installmentPlans` closed series.
   * Only the series are described: occurrences are computed by the backend from
   * each saved series. `links` must have at least one account when any quantity is `> 0`.
   *
   * Reproducibility contract: recurrences consume `random` before installment
   * plans, and each series consumes it in the order written below.
   */
  static planTransactionSeries(
    recurrences: number,
    installmentPlans: number,
    period: DevDataPeriodDTO,
    links: DevDataLinksDTO,
    random: PseudoRandom,
  ): TransactionSeriesBlueprint[] {
    const series: TransactionSeriesBlueprint[] = [];

    for (let i = 0; i < recurrences; i++) {
      const template = random.weightedPick(RECURRENCES_CATALOG, (item) => item.weight);
      const value =
        random.int(Math.round(template.valueRange.min * 100), Math.round(template.valueRange.max * 100)) / 100;
      const startDate = DevDataPlanner.randomDateBetween(period.from, period.today, random);
      const recurrence = DevDataPlanner.planRecurrenceRule(template, random);

      series.push({
        name: template.name,
        value,
        direction: template.direction,
        kind: 'OPEN',
        recurrence,
        startDate,
        installments: null,
        note: null,
        categoryHint: template.categoryHint,
        ...DevDataPlanner.planSeriesLinks(template.direction, links, random),
      });
    }

    for (let i = 0; i < installmentPlans; i++) {
      const template = random.weightedPick(INSTALLMENT_PLANS_CATALOG, (item) => item.weight);
      const installments = random.int(template.installmentsRange.min, template.installmentsRange.max);
      const totalCents = random.int(Math.round(template.totalRange.min * 100), Math.round(template.totalRange.max * 100));
      const value = Math.round(totalCents / installments) / 100;
      const dayOfMonth = random.int(1, MAX_PLANNED_DAY_OF_MONTH);

      // Early enough that, when the period allows, part of the installments is already due
      // and part is still to come; never before the period nor after today.
      const { year, month } = DevDataPlanner.parseDate(period.today);
      const earliestStart = DevDataPlanner.formatUtcDate(new Date(Date.UTC(year, month - 1 - (installments - 1), 1)));
      const from = earliestStart > period.from ? earliestStart : period.from;
      const startDate = DevDataPlanner.randomDateBetween(from, period.today, random);

      series.push({
        name: template.name,
        value,
        direction: 'OUT',
        kind: 'CLOSED',
        recurrence: { unit: 'MONTH', interval: 1, dayOfMonth },
        startDate,
        installments,
        note: null,
        categoryHint: template.categoryHint,
        ...DevDataPlanner.planSeriesLinks('OUT', links, random),
      });
    }

    return series;
  }

  /** Rule with `interval: 1` and only the anchors of the template's unit. */
  private static planRecurrenceRule(template: RecurrenceTemplate, random: PseudoRandom): RecurrenceRuleBlueprint {
    switch (template.unit) {
      case 'WEEK':
        return { unit: 'WEEK', interval: 1, weekDay: random.int(1, 7) };
      case 'MONTH':
        return { unit: 'MONTH', interval: 1, dayOfMonth: random.int(1, MAX_PLANNED_DAY_OF_MONTH) };
      case 'YEAR': {
        const month = random.int(1, 12);
        return { unit: 'YEAR', interval: 1, month, dayOfMonth: random.int(1, MAX_PLANNED_DAY_OF_MONTH) };
      }
    }
  }

  /** Account position always; credit card position only for expenses, when the user has a card. */
  private static planSeriesLinks(
    direction: DirectionLiteral,
    links: DevDataLinksDTO,
    random: PseudoRandom,
  ): Pick<TransactionSeriesBlueprint, 'accountIndex' | 'creditCardIndex'> {
    const accountIndex = random.int(0, links.accountCount - 1);
    const creditCardIndex =
      direction === 'OUT' && links.creditCardCount > 0 && random.chance(SERIES_CREDIT_CARD_RATIO)
        ? random.int(0, links.creditCardCount - 1)
        : null;
    return { accountIndex, creditCardIndex };
  }

  /** A day between `from` and `to` (`YYYY-MM-DD`, both inclusive), counted in UTC days. */
  private static randomDateBetween(from: string, to: string, random: PseudoRandom): string {
    const fromTime = DevDataPlanner.utcTimeOf(from);
    const days = Math.round((DevDataPlanner.utcTimeOf(to) - fromTime) / MILLISECONDS_PER_DAY);
    const offset = random.int(0, days);
    return DevDataPlanner.formatUtcDate(new Date(fromTime + offset * MILLISECONDS_PER_DAY));
  }

  private static utcTimeOf(date: string): number {
    const { year, month, day } = DevDataPlanner.parseDate(date);
    return Date.UTC(year, month - 1, day);
  }

  private static parseDate(date: string): { year: number; month: number; day: number } {
    return {
      year: Number(date.slice(0, 4)),
      month: Number(date.slice(5, 7)),
      day: Number(date.slice(8, 10)),
    };
  }

  private static formatUtcDate(date: Date): string {
    return DevDataPlanner.formatDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  }

  private static formatDate(year: number, month: number, day: number): string {
    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
}
