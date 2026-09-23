import { Id } from '@poupig/shared';
import {
  DayOfWeek,
  Direction,
  FrequencyUnit,
  ScheduledTransaction,
  ScheduledTransactionGenerator,
  SeriesKind,
  TransactionStatus,
} from '../../src';
import { seriesDTO } from '../mock/transaction-series-dto.fixture';

const november2026 = { from: '2026-11-01', to: '2026-11-30' };
const weeklyOnMonday = { unit: FrequencyUnit.WEEK, interval: 1, weekDay: DayOfWeek.MONDAY };

function notebookPlan() {
  return seriesDTO({ name: 'Notebook', value: 250, direction: Direction.OUT, accountName: 'Nubank' });
}

function weeklyRecurrence(endDate: string | null = null) {
  return seriesDTO({
    name: 'Feira',
    kind: SeriesKind.OPEN,
    recurrence: weeklyOnMonday,
    installments: null,
    endDate,
  });
}

describe('ScheduledTransactionGenerator — occurrence date', () => {
  test('returns the date of an index inside an installment plan', () => {
    expect(ScheduledTransactionGenerator.occurrenceDate(notebookPlan(), 11)).toBe('2027-09-10');
  });

  test.each([12, -1, 1.5])('returns null for index %s outside an installment plan', (index) => {
    expect(ScheduledTransactionGenerator.occurrenceDate(notebookPlan(), index)).toBeNull();
  });

  test('returns the date of an index before the end of a recurrence', () => {
    expect(ScheduledTransactionGenerator.occurrenceDate(weeklyRecurrence('2026-11-15'), 7)).toBe('2026-11-09');
  });

  test('returns null for an index after the end of a recurrence', () => {
    // Index 8 would fall on 2026-11-16.
    expect(ScheduledTransactionGenerator.occurrenceDate(weeklyRecurrence('2026-11-15'), 8)).toBeNull();
  });

  test('accepts any non-negative index of a recurrence without end', () => {
    expect(ScheduledTransactionGenerator.occurrenceDate(weeklyRecurrence(), 348)).toBe('2033-05-23');
  });
});

describe('ScheduledTransactionGenerator — generation for a period', () => {
  test('suppresses the occurrence already stored', () => {
    const series = weeklyRecurrence();

    const generated = ScheduledTransactionGenerator.generateForPeriod(
      series,
      november2026,
      (seriesId, occurrenceIndex) => seriesId === series.id && occurrenceIndex === 8,
    );

    expect(generated.map((occurrence) => occurrence.occurrenceIndex)).toEqual([6, 7, 9, 10]);
  });

  test('copies the fields of the series into a valid pending entity', () => {
    const series = notebookPlan();

    const generated = ScheduledTransactionGenerator.generateForPeriod(
      series,
      { from: '2027-01-01', to: '2027-01-31' },
      () => false,
    );

    expect(generated).toHaveLength(1);
    const [occurrence] = generated;
    expect(occurrence).toBeInstanceOf(ScheduledTransaction);
    expect(Id.tryCreate(occurrence.id).isOk).toBe(true);
    expect(occurrence.userId).toBe(series.userId);
    expect(occurrence.seriesId).toBe(series.id);
    expect(occurrence.occurrenceIndex).toBe(3);
    expect(occurrence.name).toBe('Notebook');
    expect(occurrence.note).toBeNull();
    expect(occurrence.value).toBe(250);
    expect(occurrence.direction).toBe(Direction.OUT);
    expect(occurrence.accountId).toBe(series.accountId);
    expect(occurrence.creditCardId).toBeNull();
    expect(occurrence.subcategoryId).toBeNull();
    expect(occurrence.status).toBe(TransactionStatus.PENDING);
    expect(occurrence.settledOn).toBeNull();
    expect(occurrence.occurrenceOn).toBe('2027-01-10');
    expect(occurrence.expectedOn).toBe('2027-01-10');
  });

  test('copies note, credit card and subcategory of the series', () => {
    const creditCardId = Id.createUUID();
    const subcategoryId = Id.createUUID();
    const series = seriesDTO({ note: 'Loja', creditCardId, subcategoryId });

    const [occurrence] = ScheduledTransactionGenerator.generateForPeriod(
      series,
      { from: '2026-10-01', to: '2026-10-31' },
      () => false,
    );

    expect(occurrence.note).toBe('Loja');
    expect(occurrence.creditCardId).toBe(creditCardId);
    expect(occurrence.subcategoryId).toBe(subcategoryId);
  });

  test('generates another ephemeral id for the same period', () => {
    const series = notebookPlan();
    const period = { from: '2027-01-01', to: '2027-01-31' };

    const [first] = ScheduledTransactionGenerator.generateForPeriod(series, period, () => false);
    const [second] = ScheduledTransactionGenerator.generateForPeriod(series, period, () => false);

    expect(first.id).not.toBe(second.id);
    expect([first.seriesId, first.occurrenceIndex]).toEqual([second.seriesId, second.occurrenceIndex]);
  });

  test('respects the installments and the end date of the series', () => {
    expect(
      ScheduledTransactionGenerator.generateForPeriod(notebookPlan(), { from: '2027-10-01', to: '2027-10-31' }, () => false),
    ).toEqual([]);
    expect(
      ScheduledTransactionGenerator.generateForPeriod(weeklyRecurrence('2026-11-15'), november2026, () => false).map(
        (occurrence) => occurrence.occurrenceIndex,
      ),
    ).toEqual([6, 7]);
  });

  test('throws instead of dropping an occurrence that fails validation', () => {
    const series = { ...notebookPlan(), accountId: '' };

    expect(() =>
      ScheduledTransactionGenerator.generateForPeriod(series, { from: '2027-01-01', to: '2027-01-31' }, () => false),
    ).toThrow();
  });
});

describe('ScheduledTransactionGenerator — generated projection', () => {
  test('projects the generated occurrence with materialized false and the context of the series', () => {
    const series = notebookPlan();
    const [occurrence] = ScheduledTransactionGenerator.generateForPeriod(
      series,
      { from: '2027-01-01', to: '2027-01-31' },
      () => false,
    );

    const dto = ScheduledTransactionGenerator.toGeneratedDTO(occurrence, series);

    expect(dto).toEqual({
      id: occurrence.id,
      userId: series.userId,
      seriesId: series.id,
      occurrenceIndex: 3,
      occurrenceOn: '2027-01-10',
      name: 'Notebook',
      note: null,
      value: 250,
      direction: Direction.OUT,
      accountId: series.accountId,
      accountName: 'Nubank',
      creditCardId: null,
      creditCardName: null,
      subcategoryId: null,
      subcategoryName: null,
      categoryName: null,
      status: TransactionStatus.PENDING,
      expectedOn: '2027-01-10',
      settledOn: null,
      createdAt: occurrence.createdAt,
      updatedAt: occurrence.updatedAt,
      materialized: false,
      seriesName: 'Notebook',
      seriesKind: SeriesKind.CLOSED,
      installments: 12,
    });
  });

  test('projects a recurrence without optional references as nulls', () => {
    const series = weeklyRecurrence();
    const [occurrence] = ScheduledTransactionGenerator.generateForPeriod(series, november2026, () => false);

    const dto = ScheduledTransactionGenerator.toGeneratedDTO(occurrence, series);

    expect(dto.installments).toBeNull();
    expect(dto.creditCardName).toBeNull();
    expect(dto.subcategoryName).toBeNull();
    expect(dto.categoryName).toBeNull();
    expect(dto.note).toBeNull();
    expect(dto.settledOn).toBeNull();
    expect(dto.seriesKind).toBe(SeriesKind.OPEN);
  });
});
