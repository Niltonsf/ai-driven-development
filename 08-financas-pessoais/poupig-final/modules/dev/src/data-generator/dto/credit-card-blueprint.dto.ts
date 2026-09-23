/** String literals of `CardBrand` (`@poupig/credit-card`), repeated on purpose: this module imports no other domain module. */
export type CardBrandLiteral = 'VISA' | 'MASTERCARD' | 'ELO' | 'AMEX' | 'HIPERCARD' | 'DINERS' | 'OTHER';

/**
 * Description of a credit card to be created.
 *
 * Intentionally shaped like the `SaveCreditCard` input **without** `id` and
 * `userId`: the backend fills the owner and generates the id. `limit` is an
 * integer in cents, as the credit card module stores it; `lastFourDigits` has
 * exactly 4 digits.
 */
export type CreditCardBlueprint = {
  name: string;
  brand: CardBrandLiteral;
  closingDay: number;
  dueDay: number;
  lastFourDigits: string;
  limit: number;
  color: string;
};
