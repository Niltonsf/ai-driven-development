import { Direction, TransactionStatus } from '@poupig/transaction';

export const DIRECTION_LABELS: Record<Direction, string> = {
  [Direction.IN]: 'Entrada',
  [Direction.OUT]: 'Saída',
};

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  [TransactionStatus.PENDING]: 'Pendente',
  [TransactionStatus.SETTLED]: 'Efetivada',
  [TransactionStatus.CANCELED]: 'Cancelada',
};
