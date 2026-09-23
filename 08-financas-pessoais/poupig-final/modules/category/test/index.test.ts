import * as barrel from '../src';
import { Category, SaveCategory, DeleteCategory, ApplyDefaultCategories } from '../src';

describe('category package barrel', () => {
  test('re-exports the public domain surface from the package root', () => {
    expect(barrel.Category).toBe(Category);
    expect(SaveCategory).toBeDefined();
    expect(DeleteCategory).toBeDefined();
    expect(ApplyDefaultCategories).toBeDefined();
  });
});
