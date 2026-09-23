import {
  ACCOUNTS_CATALOG,
  CREDIT_CARDS_CATALOG,
  DEV_DATA_LIMITS,
  INSTALLMENT_PLANS_CATALOG,
  ONE_OFF_CATALOG,
  RECURRENCES_CATALOG,
} from '../../src';

/**
 * Copy of the default subcategory names (`default-categories.constant.ts` in the
 * category module). Copied on purpose: `@poupig/dev` imports no other domain module.
 * If the defaults are renamed, this list and the catalog hints must follow.
 */
const DEFAULT_SUBCATEGORY_NAMES = [
  'Aluguel ou Financiamento',
  'Condomínio',
  'Energia Elétrica',
  'Água e Esgoto',
  'Gás',
  'Internet e TV',
  'Manutenção e Reparos',
  'Supermercado',
  'Restaurantes e Delivery',
  'Padaria',
  'Feira',
  'Combustível',
  'Transporte Público',
  'Aplicativos de Transporte',
  'Estacionamento e Pedágio',
  'Manutenção do Veículo',
  'Seguro do Veículo',
  'Plano de Saúde',
  'Farmácia',
  'Consultas e Exames',
  'Academia e Bem-estar',
  'Mensalidade Escolar',
  'Cursos e Idiomas',
  'Material Didático',
  'Livros',
  'Cinema e Streaming',
  'Viagens',
  'Hobbies',
  'Eventos e Shows',
  'Roupas',
  'Calçados',
  'Acessórios',
  'Telefone Celular',
  'Assinaturas Digitais',
  'Serviços Domésticos',
  'Seguros',
  'Cabeleireiro e Estética',
  'Higiene Pessoal',
  'Cosméticos',
  'Creche e Babá',
  'Brinquedos',
  'Mesada',
  'Roupas Infantis',
  'Ração e Petiscos',
  'Veterinário e Vacinas',
  'Banho e Tosa',
  'Acessórios para Pets',
  'Poupança',
  'Investimentos',
  'Empréstimos e Financiamentos',
  'Fatura do Cartão de Crédito',
  'Taxas e Tarifas Bancárias',
  'Presentes',
  'Doações',
  'Celebrações',
  'IPTU',
  'IPVA',
  'Imposto de Renda',
  'Taxas Diversas',
];

const ACCOUNT_TYPES = ['CHECKING', 'SAVINGS', 'CASH', 'INVESTMENT', 'OTHER'];
const CARD_BRANDS = ['VISA', 'MASTERCARD', 'ELO', 'AMEX', 'HIPERCARD', 'DINERS', 'OTHER'];
const DIRECTIONS = ['IN', 'OUT'];
const FREQUENCY_UNITS = ['WEEK', 'MONTH', 'YEAR'];
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

function hasValidLength(name: string): boolean {
  const length = name.trim().length;
  return length >= 2 && length <= 100;
}

describe('catalog', () => {
  test('every name has 2..100 characters', () => {
    const names = [
      ...ACCOUNTS_CATALOG.map((entry) => entry.name),
      ...CREDIT_CARDS_CATALOG.map((entry) => entry.name),
      ...ONE_OFF_CATALOG.map((entry) => entry.name),
      ...RECURRENCES_CATALOG.map((entry) => entry.name),
      ...INSTALLMENT_PLANS_CATALOG.map((entry) => entry.name),
    ];

    expect(names.filter((name) => !hasValidLength(name))).toEqual([]);
  });

  test('accounts and credit cards have at least the ceiling of entries, with unique names', () => {
    expect(ACCOUNTS_CATALOG.length).toBeGreaterThanOrEqual(DEV_DATA_LIMITS.maxAccounts);
    expect(CREDIT_CARDS_CATALOG.length).toBeGreaterThanOrEqual(DEV_DATA_LIMITS.maxCreditCards);
    expect(new Set(ACCOUNTS_CATALOG.map((entry) => entry.name)).size).toBe(ACCOUNTS_CATALOG.length);
    expect(new Set(CREDIT_CARDS_CATALOG.map((entry) => entry.name)).size).toBe(CREDIT_CARDS_CATALOG.length);
  });

  test('accounts use valid type literals, icons and colors', () => {
    for (const entry of ACCOUNTS_CATALOG) {
      expect(ACCOUNT_TYPES).toContain(entry.type);
      expect(entry.financialInstitution.trim().length).toBeGreaterThan(0);
      expect(entry.icon.trim().length).toBeGreaterThan(0);
      expect(entry.color).toMatch(HEX_COLOR);
    }
  });

  test('credit cards use valid brand literals, limit ranges and billing days', () => {
    for (const entry of CREDIT_CARDS_CATALOG) {
      expect(CARD_BRANDS).toContain(entry.brand);
      expect(entry.color).toMatch(HEX_COLOR);
      expect(Number.isInteger(entry.limitRange.min)).toBe(true);
      expect(Number.isInteger(entry.limitRange.max)).toBe(true);
      expect(entry.limitRange.min).toBeGreaterThan(0);
      expect(entry.limitRange.max).toBeGreaterThanOrEqual(entry.limitRange.min);
      expect(entry.billingDays.length).toBeGreaterThan(0);
      for (const { closingDay, dueDay } of entry.billingDays) {
        expect(closingDay).toBeGreaterThanOrEqual(1);
        expect(closingDay).toBeLessThanOrEqual(31);
        expect(dueDay).toBeGreaterThanOrEqual(1);
        expect(dueDay).toBeLessThanOrEqual(31);
      }
    }
  });

  test('one-off templates use valid direction literals, positive value ranges and weights', () => {
    expect(ONE_OFF_CATALOG.some((template) => template.direction === 'IN')).toBe(true);
    expect(ONE_OFF_CATALOG.some((template) => template.direction === 'OUT')).toBe(true);

    for (const template of ONE_OFF_CATALOG) {
      expect(DIRECTIONS).toContain(template.direction);
      expect(template.valueRange.min).toBeGreaterThan(0);
      expect(template.valueRange.max).toBeGreaterThanOrEqual(template.valueRange.min);
      expect(template.weight).toBeGreaterThan(0);
    }
  });

  test('every expense hint is a default subcategory name and every income hint is null', () => {
    const expenseHints = ONE_OFF_CATALOG.filter((template) => template.direction === 'OUT').map(
      (template) => template.categoryHint,
    );
    const incomeHints = ONE_OFF_CATALOG.filter((template) => template.direction === 'IN').map(
      (template) => template.categoryHint,
    );

    expect(expenseHints.filter((hint) => hint === null || !DEFAULT_SUBCATEGORY_NAMES.includes(hint))).toEqual([]);
    expect(incomeHints.every((hint) => hint === null)).toBe(true);
  });

  test('everyday templates weigh more than rare ones', () => {
    const weightOf = (name: string) => ONE_OFF_CATALOG.find((template) => template.name === name)?.weight ?? 0;

    expect(weightOf('Revisão do carro')).toBeGreaterThan(0);
    expect(weightOf('Mercado')).toBeGreaterThan(weightOf('Revisão do carro'));
  });

  test('limits expose the series ceilings and the planned installments range', () => {
    expect(DEV_DATA_LIMITS.maxRecurrences).toBe(20);
    expect(DEV_DATA_LIMITS.maxInstallmentPlans).toBe(20);
    expect(DEV_DATA_LIMITS.minInstallments).toBe(2);
    expect(DEV_DATA_LIMITS.maxInstallmentsPlanned).toBe(24);
  });

  test('recurrence templates use valid direction and unit literals, positive value ranges and weights', () => {
    expect(RECURRENCES_CATALOG.some((template) => template.direction === 'IN')).toBe(true);
    for (const unit of FREQUENCY_UNITS) {
      expect(RECURRENCES_CATALOG.some((template) => template.unit === unit)).toBe(true);
    }

    for (const template of RECURRENCES_CATALOG) {
      expect(DIRECTIONS).toContain(template.direction);
      expect(FREQUENCY_UNITS).toContain(template.unit);
      expect(template.valueRange.min).toBeGreaterThan(0);
      expect(template.valueRange.max).toBeGreaterThanOrEqual(template.valueRange.min);
      expect(template.weight).toBeGreaterThan(0);
    }
  });

  test('installment plan templates have positive total ranges, weights and installments within 2..24', () => {
    for (const template of INSTALLMENT_PLANS_CATALOG) {
      expect(template.totalRange.min).toBeGreaterThan(0);
      expect(template.totalRange.max).toBeGreaterThanOrEqual(template.totalRange.min);
      expect(template.weight).toBeGreaterThan(0);
      expect(Number.isInteger(template.installmentsRange.min)).toBe(true);
      expect(Number.isInteger(template.installmentsRange.max)).toBe(true);
      expect(template.installmentsRange.min).toBeGreaterThanOrEqual(DEV_DATA_LIMITS.minInstallments);
      expect(template.installmentsRange.max).toBeLessThanOrEqual(DEV_DATA_LIMITS.maxInstallmentsPlanned);
      expect(template.installmentsRange.min).toBeLessThanOrEqual(template.installmentsRange.max);
      // The smallest installment is still at least one cent.
      expect(template.totalRange.min / template.installmentsRange.max).toBeGreaterThanOrEqual(0.01);
    }
  });

  test('every series expense hint is a default subcategory name and every series income hint is null', () => {
    const expenseHints = [
      ...RECURRENCES_CATALOG.filter((template) => template.direction === 'OUT').map((template) => template.categoryHint),
      ...INSTALLMENT_PLANS_CATALOG.map((template) => template.categoryHint),
    ];
    const incomeHints = RECURRENCES_CATALOG.filter((template) => template.direction === 'IN').map(
      (template) => template.categoryHint,
    );

    expect(expenseHints.filter((hint) => hint === null || !DEFAULT_SUBCATEGORY_NAMES.includes(hint))).toEqual([]);
    expect(incomeHints.length).toBeGreaterThan(0);
    expect(incomeHints.every((hint) => hint === null)).toBe(true);
  });

  test('monthly recurrences weigh more than weekly and yearly together, and yearly weigh the least', () => {
    const weightOf = (unit: string) =>
      RECURRENCES_CATALOG.filter((template) => template.unit === unit).reduce((sum, template) => sum + template.weight, 0);

    expect(weightOf('MONTH')).toBeGreaterThan(weightOf('WEEK') + weightOf('YEAR'));
    expect(weightOf('YEAR')).toBeLessThan(weightOf('WEEK'));
    expect(weightOf('YEAR')).toBeGreaterThan(0);
  });
});
