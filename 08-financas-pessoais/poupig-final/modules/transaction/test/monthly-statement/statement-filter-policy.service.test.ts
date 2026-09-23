import { Id } from '@poupig/shared';
import {
  Direction,
  StatementEntryDTO,
  StatementEntryKind,
  StatementFilterPolicy,
  TransactionStatus,
} from '../../src';

const itauAccountId = Id.createUUID();
const nubankAccountId = Id.createUUID();
const nubankCardId = Id.createUUID();
const otherCardId = Id.createUUID();

function entry(overrides: Partial<StatementEntryDTO> = {}): StatementEntryDTO {
  return {
    id: Id.createUUID(),
    kind: StatementEntryKind.TRANSACTION,
    name: 'Mercado',
    note: null,
    value: 100,
    direction: Direction.OUT,
    accountId: itauAccountId,
    accountName: 'Itaú',
    creditCardId: null,
    creditCardName: null,
    subcategoryId: null,
    subcategoryName: null,
    categoryName: null,
    status: TransactionStatus.PENDING,
    expectedOn: '2026-10-10',
    settledOn: null,
    seriesId: null,
    seriesName: null,
    seriesKind: null,
    occurrenceIndex: null,
    occurrenceOn: null,
    installments: null,
    ...overrides,
  };
}

function namesMatching(entries: StatementEntryDTO[], filters: Parameters<typeof StatementFilterPolicy.matches>[1]) {
  return entries.filter((item) => StatementFilterPolicy.matches(item, filters)).map((item) => item.name);
}

describe('StatementFilterPolicy', () => {
  test('matches every entry without filters', () => {
    const entries = [entry({ name: 'Netflix' }), entry({ name: 'Mercado' })];

    expect(namesMatching(entries, {})).toEqual(['Netflix', 'Mercado']);
  });

  test('searches part of the name without distinguishing upper and lower case', () => {
    const entries = [entry({ name: 'Netflix' }), entry({ name: 'Mercado' })];

    expect(namesMatching(entries, { search: 'netf' })).toEqual(['Netflix']);
    expect(namesMatching(entries, { search: '  NETF ' })).toEqual(['Netflix']);
  });

  test('ignores a blank search', () => {
    const entries = [entry({ name: 'Netflix' }), entry({ name: 'Mercado' })];

    expect(namesMatching(entries, { search: '   ' })).toEqual(['Netflix', 'Mercado']);
  });

  test('filters by direction', () => {
    const entries = [entry({ name: 'Salário', direction: Direction.IN }), entry({ name: 'Aluguel' })];

    expect(namesMatching(entries, { direction: 'IN' })).toEqual(['Salário']);
  });

  test('filters by status', () => {
    const entries = [entry({ name: 'Luz', status: TransactionStatus.SETTLED, settledOn: '2026-10-10' }), entry()];

    expect(namesMatching(entries, { status: 'SETTLED' })).toEqual(['Luz']);
  });

  test('filters by account', () => {
    const entries = [
      entry({ name: 'Itaú', accountId: itauAccountId }),
      entry({ name: 'Nubank', accountId: nubankAccountId }),
    ];

    expect(namesMatching(entries, { accountId: itauAccountId })).toEqual(['Itaú']);
  });

  test('filters by credit card', () => {
    const entries = [
      entry({ name: 'Cartão Nubank', creditCardId: nubankCardId }),
      entry({ name: 'Outro cartão', creditCardId: otherCardId }),
      entry({ name: 'Sem cartão' }),
    ];

    expect(namesMatching(entries, { creditCardId: nubankCardId })).toEqual(['Cartão Nubank']);
  });

  test('keeps only the entries with any credit card', () => {
    const entries = [
      entry({ name: 'Cartão Nubank', creditCardId: nubankCardId }),
      entry({ name: 'Outro cartão', creditCardId: otherCardId }),
      entry({ name: 'Sem cartão' }),
    ];

    expect(namesMatching(entries, { onlyCreditCard: true })).toEqual(['Cartão Nubank', 'Outro cartão']);
    expect(namesMatching(entries, { onlyCreditCard: false })).toHaveLength(3);
  });

  test('a specific credit card takes precedence over only credit card', () => {
    const entries = [
      entry({ name: 'Cartão Nubank', creditCardId: nubankCardId }),
      entry({ name: 'Outro cartão', creditCardId: otherCardId }),
      entry({ name: 'Sem cartão' }),
    ];

    expect(namesMatching(entries, { creditCardId: nubankCardId, onlyCreditCard: true })).toEqual(['Cartão Nubank']);
  });

  test('combines filters', () => {
    const entries = [
      entry({ name: 'Netflix', creditCardId: nubankCardId }),
      entry({ name: 'Netflix antigo' }),
      entry({ name: 'Mercado', creditCardId: nubankCardId }),
    ];

    expect(namesMatching(entries, { search: 'netflix', onlyCreditCard: true })).toEqual(['Netflix']);
  });
});
