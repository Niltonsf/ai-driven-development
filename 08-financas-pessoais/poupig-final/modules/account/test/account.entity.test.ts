import { Id } from '@poupig/shared';
import { Account, AccountName, AccountType } from '../src/account';

function validProps(overrides: Partial<Parameters<typeof Account.tryCreate>[0]> = {}) {
  return {
    id: Id.createUUID(),
    userId: Id.createUUID(),
    name: 'Conta Corrente',
    type: AccountType.CHECKING,
    isActive: true,
    ...overrides,
  } as Parameters<typeof Account.tryCreate>[0];
}

describe('AccountName', () => {
  test('create returns a value object for a valid name', () => {
    expect(AccountName.create('Poupança').value).toBe('Poupança');
  });

  test('create throws for a blank name', () => {
    expect(() => AccountName.create('   ')).toThrow('ACCOUNT_NAME_TOO_SHORT');
  });

  test('tryCreate rejects a name over the maximum length', () => {
    const result = AccountName.tryCreate('a'.repeat(101));
    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('ACCOUNT_NAME_TOO_LONG');
  });
});

describe('Account.tryCreate', () => {
  test('creates a valid account and defaults isActive to true when omitted', () => {
    const result = Account.tryCreate(validProps({ isActive: undefined as any }));

    expect(result.isOk).toBe(true);
    expect(result.instance.isActive).toBe(true);
  });

  test('preserves an explicit isActive value', () => {
    const result = Account.tryCreate(validProps({ isActive: false }));

    expect(result.isOk).toBe(true);
    expect(result.instance.isActive).toBe(false);
  });

  test('fails when the name is blank', () => {
    const result = Account.tryCreate(validProps({ name: '   ' }));
    expect(result.isFailure).toBe(true);
  });

  test('fails when the id is not a valid uuid', () => {
    const result = Account.tryCreate(validProps({ id: 'not-a-uuid' }));
    expect(result.isFailure).toBe(true);
  });

  test('fails when the userId is not a valid uuid', () => {
    const result = Account.tryCreate(validProps({ userId: 'not-a-uuid' }));
    expect(result.isFailure).toBe(true);
  });

  test('fails when the color is not a valid hex value', () => {
    const result = Account.tryCreate(validProps({ color: 'not-a-color' }));
    expect(result.isFailure).toBe(true);
  });

  test('accepts a valid hex color', () => {
    const result = Account.tryCreate(validProps({ color: '#1A2B3C' }));
    expect(result.isOk).toBe(true);
    expect(result.instance.color).toBe('#1A2B3C');
  });

  test('exposes all fields through getters', () => {
    const account = Account.create(
      validProps({
        name: 'Conta PJ',
        description: 'descrição',
        type: AccountType.SAVINGS,
        accountNumber: '12345-6',
        agency: '0001',
        financialInstitution: 'Banco X',
        color: '#FFFFFF',
        icon: 'bank',
      }),
    );

    expect(account.name).toBe('Conta PJ');
    expect(account.description).toBe('descrição');
    expect(account.type).toBe(AccountType.SAVINGS);
    expect(account.accountNumber).toBe('12345-6');
    expect(account.agency).toBe('0001');
    expect(account.financialInstitution).toBe('Banco X');
    expect(account.color).toBe('#FFFFFF');
    expect(account.icon).toBe('bank');
    expect(account.userId).toBeDefined();
  });
});

describe('Account.create', () => {
  test('throws when the props are invalid', () => {
    expect(() => Account.create(validProps({ name: '' }))).toThrow();
  });
});

describe('Account.softDelete', () => {
  test('stamps deletedAt without touching other fields', () => {
    const account = Account.create(validProps({ name: 'Carteira' }));

    const result = account.softDelete();

    expect(result.isOk).toBe(true);
    expect(result.instance.deletedAt).not.toBeNull();
    expect(result.instance.name).toBe('Carteira');
  });
});
