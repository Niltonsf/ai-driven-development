import {
  ACCOUNTS_CATALOG,
  CREDIT_CARDS_CATALOG,
  createRandom,
  DEV_DATA_LIMITS,
  DevDataLinksDTO,
  DevDataPlanner,
  INSTALLMENT_PLANS_CATALOG,
  ONE_OFF_CATALOG,
  RECURRENCES_CATALOG,
  TransactionBlueprint,
  TransactionSeriesBlueprint,
} from '../../src';

const TODAY = '2026-09-15';
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

function plan(quantity: number, months: number, links: DevDataLinksDTO, seed = 42, today = TODAY) {
  const period = DevDataPlanner.periodOf(months, today);
  const transactions = DevDataPlanner.planTransactions(quantity, period, links, createRandom(seed));
  return { period, transactions };
}

const monthOf = (transaction: TransactionBlueprint) => transaction.expectedOn.slice(0, 7);

describe('DevDataPlanner.periodOf', () => {
  test('one month covers the whole current month', () => {
    expect(DevDataPlanner.periodOf(1, '2026-09-15')).toEqual({
      from: '2026-09-01',
      to: '2026-09-30',
      today: '2026-09-15',
    });
  });

  test('twelve months start eleven months before the current one', () => {
    expect(DevDataPlanner.periodOf(12, '2026-09-15')).toEqual({
      from: '2025-10-01',
      to: '2026-09-30',
      today: '2026-09-15',
    });
  });

  test('crosses the year turn', () => {
    expect(DevDataPlanner.periodOf(3, '2026-01-10')).toMatchObject({ from: '2025-11-01', to: '2026-01-31' });
  });

  test('ends on February 29 in leap years and on February 28 otherwise', () => {
    expect(DevDataPlanner.periodOf(1, '2028-02-10').to).toBe('2028-02-29');
    expect(DevDataPlanner.periodOf(1, '2026-02-10').to).toBe('2026-02-28');
  });

  test('monthsOf lists the months chronologically with their last day', () => {
    expect(DevDataPlanner.monthsOf(DevDataPlanner.periodOf(3, '2026-01-10'))).toEqual([
      { year: 2025, month: 11, lastDay: 30 },
      { year: 2025, month: 12, lastDay: 31 },
      { year: 2026, month: 1, lastDay: 31 },
    ]);
  });
});

describe('DevDataPlanner.planTransactions', () => {
  const links: DevDataLinksDTO = { accountCount: 3, creditCardCount: 2 };

  test('produces exactly the requested quantity, sorted by expectedOn', () => {
    const { transactions } = plan(150, 3, links);

    expect(transactions).toHaveLength(150);
    const dates = transactions.map((transaction) => transaction.expectedOn);
    expect(dates).toEqual([...dates].sort());
  });

  test('keeps every date inside the period and covers July, August and September', () => {
    const { period, transactions } = plan(60, 3, links);

    for (const { expectedOn } of transactions) {
      expect(expectedOn >= period.from && expectedOn <= period.to).toBe(true);
    }
    expect(new Set(transactions.map(monthOf))).toEqual(new Set(['2026-07', '2026-08', '2026-09']));
  });

  test('covers every month whenever quantity >= months', () => {
    for (let months = 1; months <= 12; months++) {
      const { period, transactions } = plan(months, months, links, months);
      const expected = DevDataPlanner.monthsOf(period).map(
        ({ year, month }) => `${year}-${String(month).padStart(2, '0')}`,
      );

      expect(new Set(transactions.map(monthOf))).toEqual(new Set(expected));
    }
  });

  test('a single transaction over twelve months falls in the current month', () => {
    for (let seed = 0; seed < 20; seed++) {
      const { transactions } = plan(1, 12, links, seed);

      expect(transactions).toHaveLength(1);
      expect(monthOf(transactions[0]!)).toBe('2026-09');
    }
  });

  test('settles everything before today and leaves today onwards pending', () => {
    const { transactions } = plan(120, 2, links);

    expect(transactions.some((transaction) => transaction.expectedOn < TODAY)).toBe(true);
    expect(transactions.some((transaction) => transaction.expectedOn >= TODAY)).toBe(true);
    for (const transaction of transactions) {
      if (transaction.expectedOn < TODAY) {
        expect(transaction.status).toBe('SETTLED');
        expect(transaction.settledOn).toBe(transaction.expectedOn);
      } else {
        expect(transaction.status).toBe('PENDING');
        expect(transaction.settledOn).toBeNull();
      }
      expect(transaction.note).toBeNull();
    }
  });

  test('income never has a credit card, and some expenses do when cards exist', () => {
    const { transactions } = plan(200, 3, { accountCount: 2, creditCardCount: 3 });

    const income = transactions.filter((transaction) => transaction.direction === 'IN');
    const withCard = transactions.filter((transaction) => transaction.creditCardIndex !== null);

    expect(income.length).toBeGreaterThan(0);
    expect(income.every((transaction) => transaction.creditCardIndex === null)).toBe(true);
    expect(withCard.length).toBeGreaterThan(0);
    for (const transaction of withCard) {
      expect(transaction.direction).toBe('OUT');
      expect(transaction.creditCardIndex).toBeGreaterThanOrEqual(0);
      expect(transaction.creditCardIndex).toBeLessThanOrEqual(2);
    }
  });

  test('no transaction has a credit card when there is none', () => {
    const { transactions } = plan(50, 3, { accountCount: 1, creditCardCount: 0 });

    expect(transactions.every((transaction) => transaction.creditCardIndex === null)).toBe(true);
  });

  test('income is at most 20% of the plan', () => {
    for (const quantity of [1, 4, 5, 7, 10, 99, 100, 333, 500]) {
      const { transactions } = plan(quantity, 3, links, quantity);
      const incomeCount = transactions.filter((transaction) => transaction.direction === 'IN').length;

      expect(incomeCount).toBeLessThanOrEqual(Math.floor(quantity * 0.2));
    }
    expect(plan(100, 3, links).transactions.filter((t) => t.direction === 'IN').length).toBeLessThanOrEqual(20);
  });

  test('account positions stay within the available accounts', () => {
    const { transactions } = plan(300, 6, { accountCount: 3, creditCardCount: 0 });
    const positions = new Set(transactions.map((transaction) => transaction.accountIndex));

    for (const position of positions) {
      expect(position).toBeGreaterThanOrEqual(0);
      expect(position).toBeLessThanOrEqual(2);
    }
    expect(positions.size).toBe(3);
  });

  test('name, direction, hint and value come from a catalog template', () => {
    const { transactions } = plan(200, 4, links);

    for (const transaction of transactions) {
      const template = ONE_OFF_CATALOG.find((item) => item.name === transaction.name);

      expect(template).toBeDefined();
      expect(transaction.direction).toBe(template!.direction);
      expect(transaction.categoryHint).toBe(template!.categoryHint);
      expect(transaction.value).toBeGreaterThanOrEqual(template!.valueRange.min);
      expect(transaction.value).toBeLessThanOrEqual(template!.valueRange.max);
      expect(Math.round(transaction.value * 100) / 100).toBe(transaction.value);
    }
  });

  test('same seed yields the same transactions', () => {
    expect(plan(100, 5, links, 7).transactions).toEqual(plan(100, 5, links, 7).transactions);
  });
});

describe('DevDataPlanner.planAccounts', () => {
  test('ten accounts without repeated names, with valid type and color', () => {
    const accounts = DevDataPlanner.planAccounts(10, createRandom(1));

    expect(accounts).toHaveLength(10);
    expect(new Set(accounts.map((account) => account.name)).size).toBe(10);
    for (const account of accounts) {
      expect(['CHECKING', 'SAVINGS', 'CASH', 'INVESTMENT', 'OTHER']).toContain(account.type);
      expect(account.color).toMatch(HEX_COLOR);
      expect(account).not.toHaveProperty('id');
      expect(account).not.toHaveProperty('userId');
      expect(ACCOUNTS_CATALOG.map((entry) => entry.name)).toContain(account.name);
    }
  });

  test('returns exactly the requested quantity', () => {
    expect(DevDataPlanner.planAccounts(0, createRandom(1))).toEqual([]);
    expect(DevDataPlanner.planAccounts(3, createRandom(1))).toHaveLength(3);
  });
});

describe('DevDataPlanner.planCreditCards', () => {
  test('ten credit cards without repeated names', () => {
    const creditCards = DevDataPlanner.planCreditCards(10, createRandom(3));

    expect(creditCards).toHaveLength(10);
    expect(new Set(creditCards.map((card) => card.name)).size).toBe(10);
  });

  test('limit in integer cents within the catalog range, four-digit suffix and catalog billing days', () => {
    for (let seed = 0; seed < 10; seed++) {
      for (const card of DevDataPlanner.planCreditCards(5, createRandom(seed))) {
        const entry = CREDIT_CARDS_CATALOG.find((item) => item.name === card.name)!;

        expect(Number.isInteger(card.limit)).toBe(true);
        expect(card.limit).toBeGreaterThan(0);
        expect(card.limit / 100).toBeGreaterThanOrEqual(entry.limitRange.min);
        expect(card.limit / 100).toBeLessThanOrEqual(entry.limitRange.max);
        expect(card.lastFourDigits).toMatch(/^\d{4}$/);
        expect(entry.billingDays).toContainEqual({ closingDay: card.closingDay, dueDay: card.dueDay });
        expect(card.brand).toBe(entry.brand);
        expect(card.color).toMatch(HEX_COLOR);
        expect(card).not.toHaveProperty('id');
        expect(card).not.toHaveProperty('userId');
      }
    }
  });
});

describe('DevDataPlanner.planTransactionSeries', () => {
  const SERIES_TODAY = '2026-09-16';
  const links: DevDataLinksDTO = { accountCount: 3, creditCardCount: 2 };

  function planSeries(
    recurrences: number,
    installmentPlans: number,
    months: number,
    seriesLinks: DevDataLinksDTO = links,
    seed = 42,
    today = SERIES_TODAY,
  ) {
    const period = DevDataPlanner.periodOf(months, today);
    const series = DevDataPlanner.planTransactionSeries(recurrences, installmentPlans, period, seriesLinks, createRandom(seed));
    return { period, series };
  }

  const open = (series: TransactionSeriesBlueprint[]) => series.filter((item) => item.kind === 'OPEN');
  const closed = (series: TransactionSeriesBlueprint[]) => series.filter((item) => item.kind === 'CLOSED');

  test('produces exactly the requested quantity of each kind, recurrences first', () => {
    const { series } = planSeries(7, 5, 3);

    expect(series).toHaveLength(12);
    expect(series.slice(0, 7).every((item) => item.kind === 'OPEN')).toBe(true);
    expect(series.slice(7).every((item) => item.kind === 'CLOSED')).toBe(true);
    expect(planSeries(0, 0, 3).series).toEqual([]);
    expect(open(planSeries(10, 0, 3).series)).toHaveLength(10);
    expect(closed(planSeries(0, 20, 3).series)).toHaveLength(20);
  });

  test('every startDate is between the first day of the period and today', () => {
    for (let seed = 0; seed < 10; seed++) {
      for (const months of [1, 6, 12]) {
        const { period, series } = planSeries(20, 20, months, links, seed);

        for (const { startDate } of series) {
          expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(startDate >= period.from && startDate <= SERIES_TODAY).toBe(true);
        }
      }
    }
    expect(planSeries(20, 20, 6).series.every((item) => item.startDate >= '2026-04-01')).toBe(true);
  });

  test('on the first day of the month every series starts today', () => {
    const { series } = planSeries(10, 10, 1, links, 9, '2026-09-01');

    expect(series.every((item) => item.startDate === '2026-09-01')).toBe(true);
  });

  test('installment plans start no earlier than installments - 1 months before today', () => {
    for (let seed = 0; seed < 10; seed++) {
      for (const item of closed(planSeries(0, 20, 12, links, seed).series)) {
        const earliest = new Date(Date.UTC(2026, 8 - (item.installments! - 1), 1)).toISOString().slice(0, 10);

        expect(item.startDate >= earliest).toBe(true);
      }
    }
  });

  test('recurrences are open, from a recurrence template, with the template unit and no installments', () => {
    const { series } = planSeries(20, 0, 6);

    for (const item of series) {
      const template = RECURRENCES_CATALOG.find((entry) => entry.name === item.name);

      expect(template).toBeDefined();
      expect(item.kind).toBe('OPEN');
      expect(item.installments).toBeNull();
      expect(item).not.toHaveProperty('endDate');
      expect(item.direction).toBe(template!.direction);
      expect(item.recurrence.unit).toBe(template!.unit);
      expect(item.categoryHint).toBe(template!.categoryHint);
      expect(item.value).toBeGreaterThanOrEqual(template!.valueRange.min);
      expect(item.value).toBeLessThanOrEqual(template!.valueRange.max);
      expect(Math.round(item.value * 100) / 100).toBe(item.value);
    }
  });

  test('installment plans are closed monthly expenses with the installment computed from the total', () => {
    for (let seed = 0; seed < 10; seed++) {
      for (const item of planSeries(0, 20, 6, links, seed).series) {
        const template = INSTALLMENT_PLANS_CATALOG.find((entry) => entry.name === item.name);

        expect(template).toBeDefined();
        expect(item.kind).toBe('CLOSED');
        expect(item.direction).toBe('OUT');
        expect(item.recurrence.unit).toBe('MONTH');
        expect(item.categoryHint).toBe(template!.categoryHint);

        const installments = item.installments!;
        expect(Number.isInteger(installments)).toBe(true);
        expect(installments).toBeGreaterThanOrEqual(DEV_DATA_LIMITS.minInstallments);
        expect(installments).toBeLessThanOrEqual(DEV_DATA_LIMITS.maxInstallmentsPlanned);
        expect(installments).toBeGreaterThanOrEqual(template!.installmentsRange.min);
        expect(installments).toBeLessThanOrEqual(template!.installmentsRange.max);

        expect(item.value).toBeGreaterThan(0);
        expect(Math.round(item.value * 100) / 100).toBe(item.value);
        // Rounding the installment to cents moves the total by at most half a cent per installment.
        const tolerance = installments * 0.005 + 1e-9;
        expect(item.value * installments).toBeGreaterThanOrEqual(template!.totalRange.min - tolerance);
        expect(item.value * installments).toBeLessThanOrEqual(template!.totalRange.max + tolerance);
      }
    }
  });

  test('every rule has interval 1 and only the anchors of its unit', () => {
    const units = new Set<string>();

    for (let seed = 0; seed < 10; seed++) {
      for (const { recurrence } of planSeries(20, 20, 12, links, seed).series) {
        units.add(recurrence.unit);
        expect(recurrence.interval).toBe(1);

        switch (recurrence.unit) {
          case 'WEEK':
            expect(Object.keys(recurrence).sort()).toEqual(['interval', 'unit', 'weekDay']);
            expect(recurrence.weekDay).toBeGreaterThanOrEqual(1);
            expect(recurrence.weekDay).toBeLessThanOrEqual(7);
            break;
          case 'MONTH':
            expect(Object.keys(recurrence).sort()).toEqual(['dayOfMonth', 'interval', 'unit']);
            expect(recurrence.dayOfMonth).toBeGreaterThanOrEqual(1);
            expect(recurrence.dayOfMonth).toBeLessThanOrEqual(28);
            break;
          case 'YEAR':
            expect(Object.keys(recurrence).sort()).toEqual(['dayOfMonth', 'interval', 'month', 'unit']);
            expect(recurrence.month).toBeGreaterThanOrEqual(1);
            expect(recurrence.month).toBeLessThanOrEqual(12);
            expect(recurrence.dayOfMonth).toBeGreaterThanOrEqual(1);
            expect(recurrence.dayOfMonth).toBeLessThanOrEqual(28);
            break;
        }
      }
    }

    expect(units).toEqual(new Set(['WEEK', 'MONTH', 'YEAR']));
  });

  test('income never has a credit card, and some expenses do when cards exist', () => {
    const series = Array.from({ length: 5 }, (_, seed) => planSeries(20, 20, 6, links, seed).series).flat();

    const income = series.filter((item) => item.direction === 'IN');
    const withCard = series.filter((item) => item.creditCardIndex !== null);

    expect(income.length).toBeGreaterThan(0);
    expect(income.every((item) => item.creditCardIndex === null)).toBe(true);
    expect(withCard.length).toBeGreaterThan(0);
    for (const item of withCard) {
      expect(item.direction).toBe('OUT');
      expect(item.creditCardIndex).toBeGreaterThanOrEqual(0);
      expect(item.creditCardIndex).toBeLessThanOrEqual(1);
    }
  });

  test('no series has a credit card when there is none', () => {
    const { series } = planSeries(20, 20, 6, { accountCount: 1, creditCardCount: 0 });

    expect(series.every((item) => item.creditCardIndex === null)).toBe(true);
  });

  test('account positions stay within the existing accounts', () => {
    const series = Array.from({ length: 5 }, (_, seed) =>
      planSeries(20, 20, 6, { accountCount: 3, creditCardCount: 0 }, seed).series,
    ).flat();
    const positions = new Set(series.map((item) => item.accountIndex));

    for (const position of positions) {
      expect(position).toBeGreaterThanOrEqual(0);
      expect(position).toBeLessThanOrEqual(2);
    }
    expect(positions.size).toBe(3);
  });

  test('every series has a null note and no id nor owner', () => {
    for (const item of planSeries(20, 20, 6).series) {
      expect(item.note).toBeNull();
      expect(item).not.toHaveProperty('id');
      expect(item).not.toHaveProperty('userId');
    }
  });

  test('same seed yields the same series', () => {
    expect(planSeries(15, 12, 9, links, 7).series).toEqual(planSeries(15, 12, 9, links, 7).series);
  });
});
