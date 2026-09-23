import { DevDataErrors, DevDataLinksDTO, PlanTransactionData, PlanTransactionDataInput } from '../../src';

const TODAY = '2026-09-15';
const FIXED_SEED = 777;

type Request = PlanTransactionDataInput['request'];

function setup() {
  const seedSource = jest.fn(() => FIXED_SEED);
  const useCase = new PlanTransactionData(seedSource);
  return { seedSource, useCase };
}

function request(overrides: Partial<Request> = {}): Request {
  return { accounts: 0, creditCards: 0, transactions: 0, months: 3, ...overrides };
}

async function planWith(overrides: Partial<Request>, links: DevDataLinksDTO = { accountCount: 2, creditCardCount: 1 }) {
  const { useCase } = setup();
  return useCase.execute({ request: request(overrides), today: TODAY, links });
}

describe('PlanTransactionData — validation', () => {
  test('rejects a request with nothing checked', async () => {
    const result = await planWith({});

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual([DevDataErrors.INVALID_DEV_DATA_REQUEST]);
  });

  test.each([
    ['above the ceiling', { transactions: 501 }],
    ['negative', { accounts: -1, transactions: 5 }],
    ['fractional', { accounts: 2.5 }],
    ['NaN', { creditCards: Number.NaN, accounts: 1 }],
    ['accounts above the ceiling', { accounts: 11 }],
    ['credit cards above the ceiling', { creditCards: 11 }],
  ])('rejects a quantity %s', async (_label, overrides) => {
    const result = await planWith(overrides);

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(DevDataErrors.INVALID_DEV_DATA_QUANTITY);
  });

  test.each([
    ['0', { months: 0 }],
    ['13', { months: 13 }],
    ['fractional', { months: 2.5 }],
    ['absent', { months: undefined }],
  ])('rejects period %s', async (_label, overrides) => {
    const result = await planWith({ accounts: 1, ...overrides });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual([DevDataErrors.INVALID_DEV_DATA_PERIOD]);
  });

  test.each([
    ['fractional', 1.5],
    ['NaN', Number.NaN],
    ['unsafe', 2 ** 53],
  ])('rejects a %s seed', async (_label, seed) => {
    const result = await planWith({ accounts: 1, months: 1, seed });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual([DevDataErrors.INVALID_DEV_DATA_SEED]);
  });

  test('accumulates several violated rules without repetition', async () => {
    const twoRules = await planWith({ accounts: 11, months: 0 });
    expect(twoRules.errors).toEqual([DevDataErrors.INVALID_DEV_DATA_QUANTITY, DevDataErrors.INVALID_DEV_DATA_PERIOD]);

    // No quantity is greater than zero, all of them are invalid, the period is out of range and the seed is fractional.
    const allRules = await planWith({ accounts: -1, creditCards: -2.5, transactions: -3, months: 13, seed: 0.5 });
    expect(allRules.errors).toEqual([
      DevDataErrors.INVALID_DEV_DATA_REQUEST,
      DevDataErrors.INVALID_DEV_DATA_QUANTITY,
      DevDataErrors.INVALID_DEV_DATA_PERIOD,
      DevDataErrors.INVALID_DEV_DATA_SEED,
    ]);
  });

  test('rejects transactions without an existing account nor an account to create', async () => {
    const result = await planWith({ transactions: 20 }, { accountCount: 0, creditCardCount: 0 });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual([DevDataErrors.DEV_DATA_ACCOUNT_REQUIRED]);
  });

  test('checks the account requirement only after the format rules pass', async () => {
    const result = await planWith({ transactions: 20, months: 0 }, { accountCount: 0, creditCardCount: 0 });

    expect(result.errors).toEqual([DevDataErrors.INVALID_DEV_DATA_PERIOD]);
  });

  test('does not call the seed source when the request is rejected', async () => {
    const { seedSource, useCase } = setup();

    await useCase.execute({ request: request(), today: TODAY, links: { accountCount: 1, creditCardCount: 0 } });

    expect(seedSource).not.toHaveBeenCalled();
  });
});

describe('PlanTransactionData — plan', () => {
  test('accepts transactions without existing accounts when accounts will be created', async () => {
    const result = await planWith({ accounts: 2, transactions: 20 }, { accountCount: 0, creditCardCount: 0 });

    expect(result.isOk).toBe(true);
    const plan = result.instance;
    expect(plan.accounts).toHaveLength(2);
    expect(plan.transactions).toHaveLength(20);
    expect(plan.transactions.every((t) => t.accountIndex >= 0 && t.accountIndex <= 1)).toBe(true);
  });

  test('links positions consider existing records plus the planned ones', async () => {
    const result = await planWith(
      { accounts: 2, creditCards: 1, transactions: 100 },
      { accountCount: 1, creditCardCount: 0 },
    );

    const { transactions } = result.instance;
    expect(transactions.every((t) => t.accountIndex >= 0 && t.accountIndex <= 2)).toBe(true);
    expect(transactions.every((t) => t.creditCardIndex === null || t.creditCardIndex === 0)).toBe(true);
    expect(transactions.some((t) => t.creditCardIndex === 0)).toBe(true);
  });

  test('returns the exact quantities and the period', async () => {
    const result = await planWith({ accounts: 3, creditCards: 2, transactions: 150, months: 3, seed: 1 });

    expect(result.isOk).toBe(true);
    const plan = result.instance;
    expect(plan.accounts).toHaveLength(3);
    expect(plan.creditCards).toHaveLength(2);
    expect(plan.transactions).toHaveLength(150);
    expect(plan.period).toEqual({ from: '2026-07-01', to: '2026-09-30', today: TODAY });
    expect(plan.seed).toBe(1);
  });

  test('same seed produces the same plan', async () => {
    const overrides = { accounts: 4, creditCards: 3, transactions: 120, months: 6, seed: 42 };

    const first = await planWith(overrides);
    const second = await planWith(overrides);

    expect(first.instance).toEqual(second.instance);
  });

  test('without seed, uses the seed source and returns the seed in the plan', async () => {
    const { seedSource, useCase } = setup();
    const links = { accountCount: 1, creditCardCount: 1 };
    const withoutSeed = request({ accounts: 2, creditCards: 2, transactions: 80 });

    const drawn = await useCase.execute({ request: withoutSeed, today: TODAY, links });

    expect(seedSource).toHaveBeenCalledTimes(1);
    expect(drawn.instance.seed).toBe(FIXED_SEED);

    const replayed = await useCase.execute({ request: { ...withoutSeed, seed: drawn.instance.seed }, today: TODAY, links });
    expect(seedSource).toHaveBeenCalledTimes(1);
    expect(replayed.instance).toEqual(drawn.instance);
  });

  test('an informed seed of zero is used as is', async () => {
    const { seedSource, useCase } = setup();

    const result = await useCase.execute({
      request: request({ accounts: 1, seed: 0 }),
      today: TODAY,
      links: { accountCount: 0, creditCardCount: 0 },
    });

    expect(seedSource).not.toHaveBeenCalled();
    expect(result.instance.seed).toBe(0);
  });
});
