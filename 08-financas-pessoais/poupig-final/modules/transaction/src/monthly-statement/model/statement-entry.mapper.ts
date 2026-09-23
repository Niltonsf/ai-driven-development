import { ScheduledTransactionDTO } from '../../scheduled-transaction/dto';
import { TransactionDTO } from '../../transaction/dto';
import { StatementEntryDTO } from '../dto/statement-entry.dto';
import { StatementEntryKind } from './statement-entry-kind.enum';

/** Converts the read projections of the module into statement entries. */
export class StatementEntryMapper {
  /** A standalone transaction: the whole series block is `null`. */
  static fromTransaction(dto: TransactionDTO): StatementEntryDTO {
    return {
      id: dto.id,
      kind: StatementEntryKind.TRANSACTION,
      name: dto.name,
      note: dto.note,
      value: dto.value,
      direction: dto.direction,
      accountId: dto.accountId,
      accountName: dto.accountName,
      creditCardId: dto.creditCardId,
      creditCardName: dto.creditCardName,
      subcategoryId: dto.subcategoryId,
      subcategoryName: dto.subcategoryName,
      categoryName: dto.categoryName,
      status: dto.status,
      expectedOn: dto.expectedOn,
      settledOn: dto.settledOn,
      seriesId: null,
      seriesName: null,
      seriesKind: null,
      occurrenceIndex: null,
      occurrenceOn: null,
      installments: null,
    };
  }

  /** An occurrence of a series, stored or generated in memory. */
  static fromScheduled(dto: ScheduledTransactionDTO): StatementEntryDTO {
    return {
      id: dto.id,
      kind: StatementEntryKind.SCHEDULED,
      name: dto.name,
      note: dto.note,
      value: dto.value,
      direction: dto.direction,
      accountId: dto.accountId,
      accountName: dto.accountName,
      creditCardId: dto.creditCardId,
      creditCardName: dto.creditCardName,
      subcategoryId: dto.subcategoryId,
      subcategoryName: dto.subcategoryName,
      categoryName: dto.categoryName,
      status: dto.status,
      expectedOn: dto.expectedOn,
      settledOn: dto.settledOn,
      seriesId: dto.seriesId,
      seriesName: dto.seriesName,
      seriesKind: dto.seriesKind,
      occurrenceIndex: dto.occurrenceIndex,
      occurrenceOn: dto.occurrenceOn,
      installments: dto.installments,
    };
  }
}
