import { Id, Result } from '@poupig/shared';
import { Card, CardBrand, SaveCreditCard, SaveCreditCardErrors } from '../src/credit-card';
import { CreditCardRepository } from '../src/credit-card/provider';
import { InMemoryCreditCardRepository } from './mock/in-memory-credit-card.repository';

const userId = Id.createUUID();

function baseInput(overrides: Partial<Parameters<SaveCreditCard['execute']>[0]> = {}) {
  return {
    id: Id.createUUID(),
    userId,
    name: 'Cartão Principal',
    brand: CardBrand.VISA,
    closingDay: 10,
    dueDay: 17,
    ...overrides,
  } as Parameters<SaveCreditCard['execute']>[0];
}

class ScriptedCreditCardRepository implements CreditCardRepository {
  constructor(
    private readonly findByIdResult: () => Result<Card | null>,
    private readonly findByNameResult: () => Result<Card | null> = () => Result.ok(null),
  ) {}

  async save(): Promise<Result<void>> {
    return Result.ok();
  }
  async findById(): Promise<Result<Card | null>> {
    return this.findByIdResult();
  }
  async findByNameAndUserId(): Promise<Result<Card | null>> {
    return this.findByNameResult();
  }
  async delete(): Promise<Result<void>> {
    return Result.ok();
  }
}

describe('SaveCreditCard — create flow', () => {
  test('creates a new card and persists it as active', async () => {
    const repository = new InMemoryCreditCardRepository();
    const useCase = new SaveCreditCard(repository);
    const id = Id.createUUID();

    const result = await useCase.execute(baseInput({ id, name: 'Nubank', lastFourDigits: '1234' }));

    expect(result.isOk).toBe(true);
    const saved = await repository.findById(id);
    expect(saved.instance!.name).toBe('Nubank');
    expect(saved.instance!.isActive).toBe(true);
  });

  test('fails when the user already has a card with the same name', async () => {
    const repository = new InMemoryCreditCardRepository();
    const useCase = new SaveCreditCard(repository);

    await useCase.execute(baseInput({ name: 'Inter' }));
    const result = await useCase.execute(baseInput({ name: 'Inter' }));

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(SaveCreditCardErrors.CREDIT_CARD_NAME_ALREADY_EXISTS);
  });

  test('fails when the card cannot be built from the input', async () => {
    const repository = new InMemoryCreditCardRepository();
    const useCase = new SaveCreditCard(repository);

    const result = await useCase.execute(baseInput({ closingDay: 99 }));

    expect(result.isFailure).toBe(true);
    expect(result.errors).not.toContain(SaveCreditCardErrors.CREDIT_CARD_NAME_ALREADY_EXISTS);
  });

  test('propagates the failure when the initial lookup fails', async () => {
    const repository = new ScriptedCreditCardRepository(() => Result.fail('FIND_BY_ID_FAILED'));
    const useCase = new SaveCreditCard(repository);

    const result = await useCase.execute(baseInput());

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('FIND_BY_ID_FAILED');
  });

  test('propagates the failure when the duplicate-name lookup fails', async () => {
    const repository = new ScriptedCreditCardRepository(
      () => Result.ok(null),
      () => Result.fail('FIND_BY_NAME_FAILED'),
    );
    const useCase = new SaveCreditCard(repository);

    const result = await useCase.execute(baseInput());

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('FIND_BY_NAME_FAILED');
  });
});

describe('SaveCreditCard — edit flow', () => {
  test('updates an existing card owned by the user', async () => {
    const repository = new InMemoryCreditCardRepository();
    const useCase = new SaveCreditCard(repository);
    const id = Id.createUUID();

    await useCase.execute(baseInput({ id, name: 'Antigo' }));
    const result = await useCase.execute(baseInput({ id, name: 'Novo', dueDay: 20, isActive: false }));

    expect(result.isOk).toBe(true);
    const updated = await repository.findById(id);
    expect(updated.instance!.name).toBe('Novo');
    expect(updated.instance!.dueDay).toBe(20);
    expect(updated.instance!.isActive).toBe(false);
  });

  test('keeps the current isActive when the update omits it', async () => {
    const repository = new InMemoryCreditCardRepository();
    const useCase = new SaveCreditCard(repository);
    const id = Id.createUUID();

    await useCase.execute(baseInput({ id, name: 'Cartão' }));
    await useCase.execute(baseInput({ id, name: 'Cartão', isActive: false }));
    const result = await useCase.execute(baseInput({ id, name: 'Cartão Renomeado' }));

    expect(result.isOk).toBe(true);
    const updated = await repository.findById(id);
    expect(updated.instance!.isActive).toBe(false);
  });

  test('fails when the card belongs to another user', async () => {
    const repository = new InMemoryCreditCardRepository();
    const useCase = new SaveCreditCard(repository);
    const id = Id.createUUID();

    await useCase.execute(baseInput({ id, name: 'Cartão' }));
    const result = await useCase.execute(baseInput({ id, userId: Id.createUUID(), name: 'Cartão' }));

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(SaveCreditCardErrors.UNAUTHORIZED);
  });

  test('fails when the updated fields are invalid', async () => {
    const repository = new InMemoryCreditCardRepository();
    const useCase = new SaveCreditCard(repository);
    const id = Id.createUUID();

    await useCase.execute(baseInput({ id, name: 'Cartão' }));
    const result = await useCase.execute(baseInput({ id, name: 'Cartão', closingDay: 50 }));

    expect(result.isFailure).toBe(true);
    expect(result.errors).not.toContain(SaveCreditCardErrors.UNAUTHORIZED);
  });
});
