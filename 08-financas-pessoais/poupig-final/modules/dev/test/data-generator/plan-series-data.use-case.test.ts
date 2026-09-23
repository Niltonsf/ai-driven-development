import { DevDataErrors, DevDataLinksDTO, PlanSeriesData, PlanSeriesDataInput } from '../../src';

const TODAY = '2026-09-16';
const FIXED_SEED = 777;

type Request = PlanSeriesDataInput['request'];

const WITH_ACCOUNTS: DevDataLinksDTO = { accountCount: 2, creditCardCount: 1 };
const WITHOUT_ACCOUNTS: DevDataLinksDTO = { accountCount: 0, creditCardCount: 0 };

function setup() {
  const seedSource = jest.fn(() => FIXED_SEED);
  const useCase = new PlanSeriesData(seedSource);
  return { seedSource, useCase };
}

function request(overrides: Partial<Request> = {}): Request {
  return { recurrences: 0, installmentPlans: 0, months: 3, ...overrides };
}

async function planWith(overrides: Partial<Request>, links: DevDataLinksDTO = WITH_ACCOUNTS) {
  const { useCase } = setup();
  return useCase.execute({ request: request(overrides), today: TODAY, links });
}

describe('PlanSeriesData — validation', () => {
  test('rejects a request with nothing checked', async () => {
    const result = await planWith({});

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual([DevDataErrors.INVALID_DEV_DATA_REQUEST]);
  });

  test.each([
    ['recurrences above the ceiling', { recurrences: 21 }],
    ['installment plans above the ceiling', { installmentPlans: 21 }],
    ['negative', { recurrences: 5, installmentPlans: -1 }],
    ['fractional', { installmentPlans: 2.5 }],
    ['NaN', { recurrences: Number.NaN, installmentPlans: 1 }],
  ])('rejects a quantity %s', async (_label, overrides) => {
    const result = await planWith(overrides);

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(DevDataErrors.INVALID_DEV_DATA_QUANTITY);
  });

  test('accepts both quantities at their ceilings', async () => {
    const result = await planWith({ recurrences: 20, installmentPlans: 20 });

    expect(result.isOk).toBe(true);
  });

  test.each([
    ['0', { months: 0 }],
    ['13', { months: 13 }],
    ['fractional', { months: 2.5 }],
    ['absent', { months: undefined }],
  ])('rejects period %s', async (_label, overrides) => {
    const result = await planWith({ recurrences: 1, ...overrides });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual([DevDataErrors.INVALID_DEV_DATA_PERIOD]);
  });

  test.each([
    ['fractional', 1.5],
    ['NaN', Number.NaN],
    ['unsafe', 2 ** 53],
  ])('rejects a %s seed', async (_label, seed) => {
    const result = await planWith({ installmentPlans: 1, months: 1, seed });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual([DevDataErrors.INVALID_DEV_DATA_SEED]);
  });

  test('accumulates several violated rules without repetition', async () => {
    const threeRules = await planWith({ recurrences: 30, months: 13, seed: 1.5 });
    expect(threeRules.errors).toEqual([
      DevDataErrors.INVALID_DEV_DATA_QUANTITY,
      DevDataErrors.INVALID_DEV_DATA_PERIOD,
      DevDataErrors.INVALID_DEV_DATA_SEED,
    ]);

    // No quantity is greater than zero, both are invalid, the period is out of range and the seed is fractional.
    const allRules = await planWith({ recurrences: -1, installmentPlans: -2.5, months: 0, seed: 0.5 });
    expect(allRules.errors).toEqual([
      DevDataErrors.INVALID_DEV_DATA_REQUEST,
      DevDataErrors.INVALID_DEV_DATA_QUANTITY,
      DevDataErrors.INVALID_DEV_DATA_PERIOD,
      DevDataErrors.INVALID_DEV_DATA_SEED,
    ]);
  });

  test('rejects a user without any account', async () => {
    const result = await planWith({ recurrences: 5 }, WITHOUT_ACCOUNTS);

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual([DevDataErrors.DEV_DATA_ACCOUNT_REQUIRED]);
  });

  test('a user with credit cards but no account is still rejected', async () => {
    const result = await planWith({ installmentPlans: 3 }, { accountCount: 0, creditCardCount: 2 });

    expect(result.errors).toEqual([DevDataErrors.DEV_DATA_ACCOUNT_REQUIRED]);
  });

  test('checks the account requirement only after the format rules pass', async () => {
    const result = await planWith({ recurrences: 5, months: 0 }, WITHOUT_ACCOUNTS);

    expect(result.errors).toEqual([DevDataErrors.INVALID_DEV_DATA_PERIOD]);
    expect(result.errors).not.toContain(DevDataErrors.DEV_DATA_ACCOUNT_REQUIRED);
  });

  test('does not call the seed source when the request is rejected', async () => {
    const { seedSource, useCase } = setup();

    await useCase.execute({ request: request(), today: TODAY, links: WITH_ACCOUNTS });
    await useCase.execute({ request: request({ recurrences: 1 }), today: TODAY, links: WITHOUT_ACCOUNTS });

    expect(seedSource).not.toHaveBeenCalled();
  });
});

describe('PlanSeriesData — plan', () => {
  test('a valid request produces the exact quantity of series and the period', async () => {
    const result = await planWith({ recurrences: 5, installmentPlans: 3, months: 6, seed: 1 }, {
      accountCount: 1,
      creditCardCount: 0,
    });

    expect(result.isOk).toBe(true);
    const plan = result.instance;
    expect(plan.series).toHaveLength(8);
    expect(plan.series.filter((series) => series.kind === 'OPEN')).toHaveLength(5);
    expect(plan.series.filter((series) => series.kind === 'CLOSED')).toHaveLength(3);
    expect(plan.period).toEqual({ from: '2026-04-01', to: '2026-09-30', today: TODAY });
    expect(plan.seed).toBe(1);
  });

  test('lists the recurrences before the installment plans', async () => {
    const { series } = (await planWith({ recurrences: 4, installmentPlans: 4, seed: 3 })).instance;

    expect(series.map((item) => item.kind)).toEqual(['OPEN', 'OPEN', 'OPEN', 'OPEN', 'CLOSED', 'CLOSED', 'CLOSED', 'CLOSED']);
  });

  test('only one kind is planned when the other is not checked', async () => {
    const onlyRecurrences = (await planWith({ recurrences: 6 })).instance.series;
    const onlyInstallmentPlans = (await planWith({ installmentPlans: 6 })).instance.series;

    expect(onlyRecurrences.every((series) => series.kind === 'OPEN')).toBe(true);
    expect(onlyInstallmentPlans.every((series) => series.kind === 'CLOSED')).toBe(true);
  });

  test('the plan carries no id, owner nor end date', async () => {
    const { series } = (await planWith({ recurrences: 10, installmentPlans: 10, seed: 5 })).instance;

    for (const item of series) {
      expect(item).not.toHaveProperty('id');
      expect(item).not.toHaveProperty('userId');
      expect(item).not.toHaveProperty('endDate');
    }
  });

  test('same seed produces the same plan', async () => {
    const overrides = { recurrences: 12, installmentPlans: 9, months: 6, seed: 42 };

    const first = await planWith(overrides);
    const second = await planWith(overrides);

    expect(first.instance).toEqual(second.instance);
  });

  test('without seed, uses the seed source and returns the seed in the plan', async () => {
    const { seedSource, useCase } = setup();
    const withoutSeed = request({ recurrences: 8, installmentPlans: 5 });

    const drawn = await useCase.execute({ request: withoutSeed, today: TODAY, links: WITH_ACCOUNTS });

    expect(seedSource).toHaveBeenCalledTimes(1);
    expect(drawn.instance.seed).toBe(FIXED_SEED);

    const replayed = await useCase.execute({
      request: { ...withoutSeed, seed: drawn.instance.seed },
      today: TODAY,
      links: WITH_ACCOUNTS,
    });
    expect(seedSource).toHaveBeenCalledTimes(1);
    expect(replayed.instance).toEqual(drawn.instance);
  });

  test('an informed seed of zero is used as is', async () => {
    const { seedSource, useCase } = setup();

    const result = await useCase.execute({
      request: request({ installmentPlans: 1, seed: 0 }),
      today: TODAY,
      links: WITH_ACCOUNTS,
    });

    expect(seedSource).not.toHaveBeenCalled();
    expect(result.instance.seed).toBe(0);
  });
});
