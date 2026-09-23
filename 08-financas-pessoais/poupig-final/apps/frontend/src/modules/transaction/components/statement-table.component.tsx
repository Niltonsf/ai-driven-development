'use client';

import { Fragment } from 'react';
import type { StatementEntryDTO } from '@poupig/transaction';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import type { StatementEntryGroup } from '../data/group-statement-entries';
import { formatClassification, formatDateOnly } from '../data/statement-format';
import type { StatementGrouping } from '../data/statement-view';
import {
  GroupCount,
  RecurrenceSign,
  SettleToggleButton,
  TransactionAmount,
  TransactionStatusBadge,
  openOnActivationKey,
} from './statement-item-parts.component';

export type StatementTableProps = {
  groups: StatementEntryGroup[];
  grouping: StatementGrouping;
  togglingId: string | null;
  onToggleSettled: (entry: StatementEntryDTO) => void;
  onOpen: (entry: StatementEntryDTO) => void;
};

/** Dense statement view: group headers spanning the row and clickable entry rows (standalone transactions and series occurrences). */
export function StatementTableComponent({ groups, grouping, togglingId, onToggleSettled, onOpen }: StatementTableProps) {
  // The group header already names the day when grouping by date.
  const showDateColumn = grouping !== 'date';
  const columnCount = showDateColumn ? 7 : 6;

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-12 pl-1">
            <span className="sr-only">Efetivar</span>
          </TableHead>
          {showDateColumn ? <TableHead className="w-28">Data</TableHead> : null}
          <TableHead>Nome</TableHead>
          <TableHead className="hidden md:table-cell">Conta</TableHead>
          <TableHead className="hidden lg:table-cell">Classificação</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          <TableHead className="pr-1">Situação</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {groups.map((group) => (
          <Fragment key={group.key}>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableCell colSpan={columnCount} className="px-3 py-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <span className="text-zinc-300">{group.label}</span>
                  <GroupCount count={group.items.length} />
                </div>
              </TableCell>
            </TableRow>

            {group.items.map((entry) => {
              const classification = formatClassification(entry);

              return (
                <TableRow
                  key={entry.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpen(entry)}
                  onKeyDown={(event) => openOnActivationKey(event, () => onOpen(entry))}
                  className="cursor-pointer focus-visible:bg-muted/60 focus-visible:outline-none"
                >
                  <TableCell className="pl-1">
                    <SettleToggleButton
                      entry={entry}
                      isToggling={togglingId === entry.id}
                      onToggle={onToggleSettled}
                    />
                  </TableCell>
                  {showDateColumn ? (
                    <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">
                      {formatDateOnly(entry.expectedOn)}
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <p className="flex items-center gap-1.5 font-medium text-foreground">
                      <span>{entry.name}</span>
                      <RecurrenceSign entry={entry} />
                    </p>
                    {entry.creditCardName ? (
                      <p className="text-xs text-muted-foreground">Cartão: {entry.creditCardName}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{entry.accountName}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {classification ?? <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <TransactionAmount entry={entry} />
                  </TableCell>
                  <TableCell className="pr-1">
                    <TransactionStatusBadge status={entry.status} />
                  </TableCell>
                </TableRow>
              );
            })}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
