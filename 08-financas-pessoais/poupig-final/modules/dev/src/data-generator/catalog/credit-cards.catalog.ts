import { CardBrandLiteral } from '../dto';

/**
 * Static catalog of credit cards (data only, no logic).
 *
 * - Every `name` has 2..100 characters (credit card name limits) and is unique
 *   in the catalog, so a shuffled slice never repeats a name inside a plan.
 * - `brand` is a string literal of `CardBrand`: this module does not import
 *   `@poupig/credit-card` nor any other domain module.
 * - `limitRange` is in **reais**; the planner converts the drawn value to cents.
 * - `billingDays` lists plausible `closingDay`/`dueDay` pairs (1..31, due about
 *   a week after closing).
 * - The catalog has at least `DEV_DATA_LIMITS.maxCreditCards` entries.
 */
export interface CreditCardCatalogEntry {
  readonly name: string;
  readonly brand: CardBrandLiteral;
  readonly color: string;
  readonly limitRange: { readonly min: number; readonly max: number };
  readonly billingDays: readonly { readonly closingDay: number; readonly dueDay: number }[];
}

export const CREDIT_CARDS_CATALOG: readonly CreditCardCatalogEntry[] = [
  {
    name: 'Nubank Ultravioleta',
    brand: 'MASTERCARD',
    color: '#820AD1',
    limitRange: { min: 5000, max: 20000 },
    billingDays: [
      { closingDay: 1, dueDay: 8 },
      { closingDay: 15, dueDay: 22 },
    ],
  },
  {
    name: 'Itaú Visa Infinite',
    brand: 'VISA',
    color: '#EC7000',
    limitRange: { min: 15000, max: 50000 },
    billingDays: [
      { closingDay: 3, dueDay: 10 },
      { closingDay: 20, dueDay: 27 },
    ],
  },
  {
    name: 'Bradesco Visa Gold',
    brand: 'VISA',
    color: '#CC092F',
    limitRange: { min: 3000, max: 12000 },
    billingDays: [
      { closingDay: 5, dueDay: 12 },
      { closingDay: 25, dueDay: 2 },
    ],
  },
  {
    name: 'Santander Mastercard Platinum',
    brand: 'MASTERCARD',
    color: '#EC0000',
    limitRange: { min: 4000, max: 15000 },
    billingDays: [
      { closingDay: 8, dueDay: 15 },
      { closingDay: 18, dueDay: 25 },
    ],
  },
  {
    name: 'Elo Nanquim Banco do Brasil',
    brand: 'ELO',
    color: '#FAE128',
    limitRange: { min: 8000, max: 30000 },
    billingDays: [
      { closingDay: 10, dueDay: 17 },
      { closingDay: 28, dueDay: 5 },
    ],
  },
  {
    name: 'Inter Mastercard Gold',
    brand: 'MASTERCARD',
    color: '#FF7A00',
    limitRange: { min: 1500, max: 6000 },
    billingDays: [
      { closingDay: 6, dueDay: 13 },
      { closingDay: 22, dueDay: 29 },
    ],
  },
  {
    name: 'C6 Carbon',
    brand: 'MASTERCARD',
    color: '#242424',
    limitRange: { min: 10000, max: 40000 },
    billingDays: [
      { closingDay: 2, dueDay: 9 },
      { closingDay: 12, dueDay: 19 },
    ],
  },
  {
    name: 'American Express Green',
    brand: 'AMEX',
    color: '#2E7D5B',
    limitRange: { min: 5000, max: 20000 },
    billingDays: [
      { closingDay: 14, dueDay: 21 },
      { closingDay: 26, dueDay: 3 },
    ],
  },
  {
    name: 'Hipercard Internacional',
    brand: 'HIPERCARD',
    color: '#B3131B',
    limitRange: { min: 1000, max: 5000 },
    billingDays: [
      { closingDay: 4, dueDay: 11 },
      { closingDay: 19, dueDay: 26 },
    ],
  },
  {
    name: 'Diners Club Elite',
    brand: 'DINERS',
    color: '#1B3A6B',
    limitRange: { min: 8000, max: 25000 },
    billingDays: [
      { closingDay: 7, dueDay: 14 },
      { closingDay: 21, dueDay: 28 },
    ],
  },
  {
    name: 'Caixa Elo Mais',
    brand: 'ELO',
    color: '#005CA9',
    limitRange: { min: 1000, max: 4000 },
    billingDays: [
      { closingDay: 9, dueDay: 16 },
      { closingDay: 24, dueDay: 1 },
    ],
  },
  {
    name: 'Porto Seguro Visa Platinum',
    brand: 'VISA',
    color: '#0055A5',
    limitRange: { min: 3000, max: 12000 },
    billingDays: [
      { closingDay: 11, dueDay: 18 },
      { closingDay: 27, dueDay: 4 },
    ],
  },
] as const;
