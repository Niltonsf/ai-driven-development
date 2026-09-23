import { Id } from '@poupig/shared';
import { Card, CardBrand } from '../../src/credit-card/model';

function validProps(overrides: Partial<Parameters<typeof Card.tryCreate>[0]> = {}) {
  return {
    id: Id.createUUID(),
    userId: Id.createUUID(),
    name: 'Cartão Roxinho',
    brand: CardBrand.MASTERCARD,
    closingDay: 10,
    dueDay: 17,
    isActive: true,
    ...overrides,
  } as Parameters<typeof Card.tryCreate>[0];
}

describe('Card.tryCreate', () => {
  test('creates a valid card and defaults isActive to true when omitted', () => {
    const result = Card.tryCreate(validProps({ isActive: undefined as any }));

    expect(result.isOk).toBe(true);
    expect(result.instance.isActive).toBe(true);
  });

  test('keeps an explicit isActive value', () => {
    const result = Card.tryCreate(validProps({ isActive: false }));
    expect(result.instance.isActive).toBe(false);
  });

  test('fails when the id is not a valid uuid', () => {
    expect(Card.tryCreate(validProps({ id: 'nope' })).isFailure).toBe(true);
  });

  test('fails when the userId is not a valid uuid', () => {
    expect(Card.tryCreate(validProps({ userId: 'nope' })).isFailure).toBe(true);
  });

  test('fails when the closing day is out of range', () => {
    expect(Card.tryCreate(validProps({ closingDay: 32 })).isFailure).toBe(true);
  });

  test('fails when the due day is out of range', () => {
    expect(Card.tryCreate(validProps({ dueDay: 0 })).isFailure).toBe(true);
  });

  test('fails when lastFourDigits is malformed', () => {
    expect(Card.tryCreate(validProps({ lastFourDigits: '12' })).isFailure).toBe(true);
  });

  test('accepts a valid lastFourDigits', () => {
    const result = Card.tryCreate(validProps({ lastFourDigits: '4321' }));
    expect(result.isOk).toBe(true);
    expect(result.instance.lastFourDigits).toBe('4321');
  });

  test('fails when the color is not a valid hex value', () => {
    expect(Card.tryCreate(validProps({ color: 'not-a-color' })).isFailure).toBe(true);
  });

  test('accepts a valid hex color', () => {
    const result = Card.tryCreate(validProps({ color: '#00FF88' }));
    expect(result.isOk).toBe(true);
    expect(result.instance.color).toBe('#00FF88');
  });

  test('exposes all fields through getters', () => {
    const card = Card.create(
      validProps({
        name: 'Cartão Gold',
        description: 'principal',
        brand: CardBrand.VISA,
        lastFourDigits: '9999',
        limit: 5000,
        color: '#123456',
        icon: 'card',
      }),
    );

    expect(card.userId).toBeDefined();
    expect(card.name).toBe('Cartão Gold');
    expect(card.description).toBe('principal');
    expect(card.brand).toBe(CardBrand.VISA);
    expect(card.lastFourDigits).toBe('9999');
    expect(card.closingDay).toBe(10);
    expect(card.dueDay).toBe(17);
    expect(card.limit).toBe(5000);
    expect(card.color).toBe('#123456');
    expect(card.icon).toBe('card');
  });
});

describe('Card.create', () => {
  test('throws when the props are invalid', () => {
    expect(() => Card.create(validProps({ closingDay: 99 }))).toThrow();
  });
});

describe('Card.softDelete', () => {
  test('stamps deletedAt while keeping other fields', () => {
    const card = Card.create(validProps({ name: 'Cartão Extra' }));

    const result = card.softDelete();

    expect(result.isOk).toBe(true);
    expect(result.instance.deletedAt).not.toBeNull();
    expect(result.instance.name).toBe('Cartão Extra');
  });
});
