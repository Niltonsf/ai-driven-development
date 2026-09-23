import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { StatementEntryDTO } from '@poupig/transaction';
import type { SelectedMonth } from '@/shared/util/month.util';

/**
 * Date-only values (`YYYY-MM-DD`) are always split into numbers and rebuilt in
 * local time. Never parse the raw string with `new Date(value)` nor format it with
 * `toISOString`/`toLocaleDateString`: in negative UTC offsets the day shifts.
 */
function parseDateOnly(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

/** Builds `dd/MM/yyyy` from the `YYYY-MM-DD` string, never through the browser time zone. */
export function formatDateOnly(value: string): string {
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

/** Day label in pt-BR built from `YYYY-MM-DD` without time zone shifts, e.g. `12 de setembro · sábado`. */
export function formatDayLabel(value: string): string {
  const date = parseDateOnly(value);
  return date ? format(date, "d 'de' MMMM '·' EEEE", { locale: ptBR }) : value;
}

/** Month as used inside a sentence, e.g. `setembro de 2026`. */
export function formatMonthInSentence({ year, month }: SelectedMonth): string {
  return format(new Date(year, month - 1, 1), "MMMM 'de' yyyy", { locale: ptBR });
}

/** `Categoria › Subcategoria`, or whichever part exists; `null` when the entry has no classification. */
export function formatClassification(entry: Pick<StatementEntryDTO, 'categoryName' | 'subcategoryName'>) {
  const parts = [entry.categoryName, entry.subcategoryName].filter(Boolean);
  return parts.length > 0 ? parts.join(' › ') : null;
}
