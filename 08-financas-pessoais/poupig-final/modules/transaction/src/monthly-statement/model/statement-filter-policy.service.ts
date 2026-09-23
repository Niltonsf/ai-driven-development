import { StatementEntryDTO } from '../dto/statement-entry.dto';

/**
 * Optional filters of the statement. Filters are raw values received by the
 * API: an absent or empty filter means "no filter".
 */
export interface StatementFilters {
  /** Part of the name, without distinguishing upper and lower case. */
  search?: string;
  direction?: string;
  status?: string;
  accountId?: string;
  /** Only the entries of this credit card. Takes precedence over `onlyCreditCard`. */
  creditCardId?: string;
  /** When `true`, only the entries linked to any credit card. Ignored when `creditCardId` is informed. */
  onlyCreditCard?: boolean;
}

/**
 * The single rule of the statement filters for the entries kept in memory
 * (stored and generated occurrences). It has the same semantics as the filter
 * applied in storage to the standalone transactions.
 */
export class StatementFilterPolicy {
  static matches(entry: StatementEntryDTO, filters: StatementFilters): boolean {
    const search = filters.search?.trim();
    if (search && !entry.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())) {
      return false;
    }

    if (filters.direction && entry.direction !== filters.direction) return false;
    if (filters.status && entry.status !== filters.status) return false;
    if (filters.accountId && entry.accountId !== filters.accountId) return false;

    if (filters.creditCardId) {
      return entry.creditCardId === filters.creditCardId;
    }

    if (filters.onlyCreditCard === true) {
      return entry.creditCardId !== null;
    }

    return true;
  }
}
