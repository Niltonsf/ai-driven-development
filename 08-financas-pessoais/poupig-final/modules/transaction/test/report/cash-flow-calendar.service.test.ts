import { CashFlowCalendar } from '../../src';

describe('CashFlowCalendar.isValidReference', () => {
  test.each([['2026-09'], ['2026-01'], ['2026-12'], ['2028-02']])('approves %p', (value) => {
    expect(CashFlowCalendar.isValidReference(value)).toBe(true);
  });

  test.each([['2026-13'], ['2026-00'], ['2026-9'], ['2026-09-01'], [''], [' 2026-09'], [undefined], [null], [202609]])(
    'rejects %p',
    (value) => {
      expect(CashFlowCalendar.isValidReference(value)).toBe(false);
    },
  );
});

describe('CashFlowCalendar.periodOf', () => {
  test('a window of 12 months crossing the year', () => {
    const period = CashFlowCalendar.periodOf('2026-09', 12);

    expect(period.from).toBe('2025-10-01');
    expect(period.to).toBe('2026-09-30');
    expect(period.monthKeys).toEqual([
      '2025-10',
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
    ]);
  });

  test('a window of 6 months inside the year', () => {
    expect(CashFlowCalendar.periodOf('2026-06', 6)).toEqual({
      from: '2026-01-01',
      to: '2026-06-30',
      monthKeys: ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'],
    });
  });

  test('a window of 24 months', () => {
    const period = CashFlowCalendar.periodOf('2026-09', 24);

    expect(period.from).toBe('2024-10-01');
    expect(period.to).toBe('2026-09-30');
    expect(period.monthKeys).toHaveLength(24);
    expect(period.monthKeys[0]).toBe('2024-10');
    expect(period.monthKeys[23]).toBe('2026-09');
    expect([...period.monthKeys].sort()).toEqual(period.monthKeys);
  });

  test('a reference in January goes back to the previous year', () => {
    expect(CashFlowCalendar.periodOf('2027-01', 6)).toEqual({
      from: '2026-08-01',
      to: '2027-01-31',
      monthKeys: ['2026-08', '2026-09', '2026-10', '2026-11', '2026-12', '2027-01'],
    });
  });

  test('February of a leap year ends on the 29th', () => {
    expect(CashFlowCalendar.periodOf('2028-02', 6).to).toBe('2028-02-29');
  });

  test('February of a common year ends on the 28th', () => {
    expect(CashFlowCalendar.periodOf('2027-02', 6).to).toBe('2027-02-28');
  });

  test('December ends on the 31st', () => {
    expect(CashFlowCalendar.periodOf('2026-12', 6).to).toBe('2026-12-31');
  });
});

describe('CashFlowCalendar.monthKeyOf', () => {
  test.each([
    ['2026-09-01', '2026-09'],
    ['2026-09-30', '2026-09'],
    ['2027-01-31', '2027-01'],
  ])('%p belongs to %p', (date, month) => {
    expect(CashFlowCalendar.monthKeyOf(date)).toBe(month);
  });
});
