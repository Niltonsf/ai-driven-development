'use client';

import { Fragment } from 'react';
import type { StatementEntryDTO } from '@poupig/transaction';
import { Card } from '@/shared/components/ui/card';
import type { StatementEntryGroup } from '../data/group-statement-entries';
import { formatClassification, formatDateOnly } from '../data/statement-format';
import {
  GroupCount,
  RecurrenceSign,
  SettleToggleButton,
  TransactionAmount,
  TransactionStatusBadge,
  openOnActivationKey,
} from './statement-item-parts.component';

export type StatementCardsProps = {
  groups: StatementEntryGroup[];
  togglingId: string | null;
  onToggleSettled: (entry: StatementEntryDTO) => void;
  onOpen: (entry: StatementEntryDTO) => void;
};

/** Touch-friendly statement view: one card per entry, one column on mobile and two from `lg`. */
export function StatementCardsComponent({ groups, togglingId, onToggleSettled, onOpen }: StatementCardsProps) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label} className="space-y-2">
          <h3 className="flex items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
            <span className="text-zinc-300">{group.label}</span>
            <GroupCount count={group.items.length} />
          </h3>

          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {group.items.map((entry) => {
              const details = [
                formatDateOnly(entry.expectedOn),
                entry.accountName,
                entry.creditCardName ? `Cartão: ${entry.creditCardName}` : null,
                formatClassification(entry),
              ].filter((detail): detail is string => Boolean(detail));

              return (
                <Card
                  key={entry.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpen(entry)}
                  onKeyDown={(event) => openOnActivationKey(event, () => onOpen(entry))}
                  className="cursor-pointer px-3 py-2.5 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center gap-2">
                    <SettleToggleButton
                      entry={entry}
                      isToggling={togglingId === entry.id}
                      onToggle={onToggleSettled}
                    />
                    <p className="flex min-w-0 flex-1 items-center gap-1.5 font-medium text-foreground">
                      <span className="truncate">{entry.name}</span>
                      <RecurrenceSign entry={entry} />
                    </p>
                    <TransactionAmount entry={entry} className="shrink-0" />
                  </div>

                  <div className="mt-1 flex items-center gap-3 pl-11">
                    <p className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                      {details.map((detail, index) => (
                        <Fragment key={`${index}-${detail}`}>
                          {index > 0 ? <span aria-hidden="true">·</span> : null}
                          <span className={index === 0 ? 'tabular-nums' : undefined}>{detail}</span>
                        </Fragment>
                      ))}
                    </p>
                    <TransactionStatusBadge status={entry.status} className="shrink-0" />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
