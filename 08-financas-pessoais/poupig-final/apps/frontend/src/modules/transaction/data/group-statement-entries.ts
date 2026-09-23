import type { StatementEntryDTO } from '@poupig/transaction';
import { formatClassification, formatDayLabel } from './statement-format';
import type { StatementGrouping } from './statement-view';

export type StatementEntryGroup = {
  key: string;
  label: string;
  items: StatementEntryDTO[];
};

export const UNCLASSIFIED_GROUP_LABEL = 'Sem classificação';

const UNCLASSIFIED_GROUP_KEY = '__unclassified__';

type KeyedGrouping = Exclude<StatementGrouping, 'date'>;

/** Consecutive days open a new group, so the order received from the API is kept. */
function groupByDate(items: StatementEntryDTO[]): StatementEntryGroup[] {
  const groups: StatementEntryGroup[] = [];

  for (const entry of items) {
    const lastGroup = groups.at(-1);
    if (lastGroup && lastGroup.items[0]?.expectedOn === entry.expectedOn) {
      lastGroup.items.push(entry);
    } else {
      groups.push({
        // The index keeps keys unique even if a day ever shows up twice in the list.
        key: `${entry.expectedOn}#${groups.length}`,
        label: formatDayLabel(entry.expectedOn),
        items: [entry],
      });
    }
  }

  return groups;
}

function resolveGroup(entry: StatementEntryDTO, grouping: KeyedGrouping): { key: string; label: string } | null {
  switch (grouping) {
    case 'account':
      return { key: entry.accountId, label: entry.accountName };
    case 'category':
      return entry.categoryName ? { key: entry.categoryName, label: entry.categoryName } : null;
    case 'subcategory':
      return entry.subcategoryId
        ? { key: entry.subcategoryId, label: formatClassification(entry) ?? UNCLASSIFIED_GROUP_LABEL }
        : null;
  }
}

/** Alphabetical groups (pt-BR), inner order preserved and `Sem classificação` always last. */
function groupByKey(items: StatementEntryDTO[], grouping: KeyedGrouping): StatementEntryGroup[] {
  const groups = new Map<string, StatementEntryGroup>();
  const unclassified: StatementEntryGroup = { key: UNCLASSIFIED_GROUP_KEY, label: UNCLASSIFIED_GROUP_LABEL, items: [] };

  for (const entry of items) {
    const resolved = resolveGroup(entry, grouping);
    if (!resolved) {
      unclassified.items.push(entry);
      continue;
    }

    const group = groups.get(resolved.key);
    if (group) {
      group.items.push(entry);
    } else {
      groups.set(resolved.key, { ...resolved, items: [entry] });
    }
  }

  const sorted = [...groups.values()].sort((left, right) => left.label.localeCompare(right.label, 'pt-BR'));
  return unclassified.items.length > 0 ? [...sorted, unclassified] : sorted;
}

/**
 * Presentation-only grouping of the statement being displayed. It never reorders
 * the entries inside a group, which already arrive by expected date descending.
 */
export function groupStatementEntries(items: StatementEntryDTO[], grouping: StatementGrouping): StatementEntryGroup[] {
  return grouping === 'date' ? groupByDate(items) : groupByKey(items, grouping);
}
