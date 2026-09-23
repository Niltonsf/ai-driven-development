import { Id, Result } from '@poupig/shared';
import {
  Card,
  CardBrand,
  DeleteCreditCard,
  DeleteCreditCardErrors,
  SaveCreditCard,
} from '../src/credit-card';
import { CreditCardRepository } from '../src/credit-card/provider';
import { InMemoryCreditCardRepository } from './mock/in-memory-credit-card.repository';

const userId = Id.createUUID();

async function seedCard(repository: InMemoryCreditCardRepository, id: string) {
  const save = new SaveCreditCard(repository);
  await save.execute({ id, userId, name: 'Cartão', brand: CardBrand.VISA, closingDay: 10, dueDay: 17 });
}

describe('DeleteCreditCard', () => {
  test('soft deletes an existing card owned by the user', async () => {
    const repository = new InMemoryCreditCardRepository();
    const useCase = new DeleteCreditCard(repository);
    const id = Id.createUUID();
    await seedCard(repository, id);

    const result = await useCase.execute({ id, userId });

    expect(result.isOk).toBe(true);
    const stored = await repository.findById(id);
    expect(stored.instance!.deletedAt).not.toBeNull();
  });

  test('fails when the card does not exist', async () => {
    const repository = new InMemoryCreditCardRepository();
    const useCase = new DeleteCreditCard(repository);

    const result = await useCase.execute({ id: Id.createUUID(), userId });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(DeleteCreditCardErrors.CREDIT_CARD_NOT_FOUND);
  });

  test('fails when the card belongs to another user', async () => {
    const repository = new InMemoryCreditCardRepository();
    const useCase = new DeleteCreditCard(repository);
    const id = Id.createUUID();
    await seedCard(repository, id);

    const result = await useCase.execute({ id, userId: Id.createUUID() });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(DeleteCreditCardErrors.UNAUTHORIZED);
  });

  test('propagates the failure when the lookup fails', async () => {
    const repository: CreditCardRepository = {
      save: async () => Result.ok(),
      findById: async () => Result.fail<Card | null>('FIND_FAILED'),
      findByNameAndUserId: async () => Result.ok(null),
      delete: async () => Result.ok(),
    };
    const useCase = new DeleteCreditCard(repository);

    const result = await useCase.execute({ id: Id.createUUID(), userId });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('FIND_FAILED');
    expect(result.errors).not.toContain(DeleteCreditCardErrors.CREDIT_CARD_NOT_FOUND);
  });

  test('propagates the failure when soft-deleting the card fails', async () => {
    const repository = new InMemoryCreditCardRepository();
    const useCase = new DeleteCreditCard(repository);
    const id = Id.createUUID();
    await seedCard(repository, id);

    const stored = (await repository.findById(id)).instance!;
    jest.spyOn(stored, 'softDelete').mockReturnValue(Result.fail('SOFT_DELETE_FAILED'));

    const result = await useCase.execute({ id, userId });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('SOFT_DELETE_FAILED');
  });
});
