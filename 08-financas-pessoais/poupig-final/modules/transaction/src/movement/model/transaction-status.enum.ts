export enum TransactionStatus {
  PENDING = 'PENDING',
  SETTLED = 'SETTLED',
  CANCELED = 'CANCELED',
}

export function isTransactionStatus(value: unknown): value is TransactionStatus {
  return (Object.values(TransactionStatus) as unknown[]).includes(value);
}
