/**
 * Origin of a statement entry: a standalone transaction or an occurrence of a
 * transaction series (stored or generated). There is no type guard: the value
 * is always produced by the domain and never arrives from outside.
 */
export enum StatementEntryKind {
  TRANSACTION = 'TRANSACTION',
  SCHEDULED = 'SCHEDULED',
}
