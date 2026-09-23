/** String literals of `AccountType` (`@poupig/account`), repeated on purpose: this module imports no other domain module. */
export type AccountTypeLiteral = 'CHECKING' | 'SAVINGS' | 'CASH' | 'INVESTMENT' | 'OTHER';

/**
 * Description of an account to be created.
 *
 * Intentionally shaped like the `SaveAccount` input **without** `id` and
 * `userId`: the backend fills the owner and generates the id. The enum comes as
 * a string literal; if it ever diverges from the owning module, the use case
 * rejects the record and the code shows up in the summary.
 */
export type AccountBlueprint = {
  name: string;
  type: AccountTypeLiteral;
  financialInstitution: string;
  icon: string;
  color: string;
};
