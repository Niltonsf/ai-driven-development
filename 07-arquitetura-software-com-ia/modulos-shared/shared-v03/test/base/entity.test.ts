import { TestEntity } from '../data/test.entity';

describe('Entity', () => {
  describe('creation', () => {
    test('should create entity with provided id', () => {
      const providedId = '550e8400-e29b-41d4-a716-446655440000';
      const result = TestEntity.tryCreate({
        id: providedId,
        number: 42,
      });

      expect(result.isOk).toBe(true);
      expect(
        result.instance.equals(
          TestEntity.tryCreate({
            id: providedId,
            number: 999,
          }).instance,
        ),
      ).toBe(true);
    });

    test('should generate id when not provided', () => {
      const result = TestEntity.tryCreate({ number: 42 });

      expect(result.isOk).toBe(true);
    });

    test('should initialize default timestamps and deletedAt as null', () => {
      const entity = TestEntity.create({ number: 42 });

      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
      expect(entity.deletedAt).toBeNull();
    });

    test('should keep provided timestamps and deletedAt', () => {
      const createdAt = new Date('2024-01-01T10:00:00.000Z');
      const updatedAt = new Date('2024-01-02T11:00:00.000Z');
      const deletedAt = new Date('2024-01-03T12:00:00.000Z');

      const entity = TestEntity.create({
        number: 42,
        createdAt,
        updatedAt,
        deletedAt,
      });

      expect(entity.createdAt).toBe(createdAt);
      expect(entity.updatedAt).toBe(updatedAt);
      expect(entity.deletedAt).toBe(deletedAt);
    });
  });

  describe('static create method', () => {
    test('should create instance', () => {
      const entity = TestEntity.create({ number: 42 });

      expect(entity).toBeInstanceOf(TestEntity);
      expect(entity.number).toBe(42);
    });

    test('should throw when creating invalid instance', () => {
      expect(() => TestEntity.create({ number: -1 })).toThrow();
    });
  });

  describe('equality', () => {
    test('should say that instances are equal if they have the same id', () => {
      const providedId = '550e8400-e29b-41d4-a716-446655440000';
      const entity1 = TestEntity.tryCreate({
        id: providedId,
        number: 42,
      }).instance;
      const entity2 = TestEntity.tryCreate({
        id: providedId,
        number: 999,
      }).instance;

      expect(entity1.equals(entity2)).toBe(true);
    });

    test('should say that instances are different if they have different ids', () => {
      const entity1 = TestEntity.tryCreate({ number: 42 }).instance;
      const entity2 = TestEntity.tryCreate({ number: 42 }).instance;

      expect(entity1.notEquals(entity2)).toBe(true);
    });
  });

  describe('serialization', () => {
    test('should expose base props with toJSON', () => {
      const createdAt = new Date('2024-02-01T00:00:00.000Z');
      const updatedAt = new Date('2024-02-02T00:00:00.000Z');
      const entity = TestEntity.create({
        id: '550e8400-e29b-41d4-a716-446655440000',
        number: 10,
        obj: { nested: true },
        createdAt,
        updatedAt,
      });

      expect(entity.toJSON()).toEqual({
        id: '550e8400-e29b-41d4-a716-446655440000',
        number: 10,
        obj: { nested: true },
        createdAt,
        updatedAt,
        deletedAt: null,
      });
    });
  });
});
