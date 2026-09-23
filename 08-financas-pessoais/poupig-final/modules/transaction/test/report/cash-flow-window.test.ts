import { CASH_FLOW_WINDOWS, isCashFlowWindow } from '../../src';

describe('CASH_FLOW_WINDOWS', () => {
  test('is exactly 6, 12, 18 and 24 months', () => {
    expect(CASH_FLOW_WINDOWS).toEqual([6, 12, 18, 24]);
  });

  test.each([[6], [12], [18], [24]])('isCashFlowWindow approves %p', (value) => {
    expect(isCashFlowWindow(value)).toBe(true);
  });

  test.each([[7], [0], [-6], [12.5], [NaN], ['12'], [null], [undefined]])('isCashFlowWindow rejects %p', (value) => {
    expect(isCashFlowWindow(value)).toBe(false);
  });
});
