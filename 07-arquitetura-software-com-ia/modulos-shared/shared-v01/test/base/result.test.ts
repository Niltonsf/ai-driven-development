/// <reference types="jest" />
import { Result } from '../../src';

describe('Result', () => {
  test('should create ok result with instance', () => {
    const result = Result.ok('value');

    expect(result.isOk).toBe(true);
    expect(result.isFailure).toBe(false);
    expect(result.instance).toBe('value');
  });

  test('should create ok result with null when instance is undefined', () => {
    const result = Result.ok();

    expect(result.isOk).toBe(true);
    expect(result.instance).toBeNull();
    expect(result.errors).toBeUndefined();
  });

  test('should create failed result from string', () => {
    const result = Result.fail('ERR');

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual(['ERR']);
  });

  test('should create failed result from string array', () => {
    const result = Result.fail(['E1', 'E2']);

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual(['E1', 'E2']);
  });

  test('should create empty result with null instance', () => {
    const result = Result.empty<string>();

    expect(result.isOk).toBe(true);
    expect(result.instance).toBeNull();
    expect(result.errors).toBeUndefined();
  });

  test('should use fallback error wrapper when fail receives non-array value', () => {
    const result = Result.fail(123 as unknown as string);

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual([123]);
  });

  test('should return RESULT_UNDEFINED when no instance and no explicit errors', () => {
    const result = new Result<string>(undefined, []);

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual(['RESULT_UNDEFINED']);
  });

  test('should return failed result with withFail', () => {
    const result = Result.fail('ERR');
    const failed = result.withFail;

    expect(failed.isFailure).toBe(true);
    expect(failed.errors).toEqual(['ERR']);
  });

  test('should convert to string for ok and fail', () => {
    const ok = Result.ok({ a: 1 });
    const fail = Result.fail('ERR');

    expect(ok.toString()).toBe('Result.ok({"a":1})');
    expect(fail.toString()).toBe('Result.fail(["ERR"])');
  });
});
