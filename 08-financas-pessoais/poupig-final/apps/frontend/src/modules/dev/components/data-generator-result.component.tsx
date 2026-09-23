import type { DevDataItemSummaryDTO } from '@poupig/dev';
import { Badge } from '@/shared/components/ui/badge';
import { EmptyListState } from '@/shared/components/ui/empty-list-state';
import { FormErrorMessage } from '@/shared/components/ui/form-error-message';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { getErrorMessage } from '@/shared/i18n';

export type DataGeneratorResultRow = {
  label: string;
  summary: DevDataItemSummaryDTO;
};

type DataGeneratorResultProps = {
  /** One row per generated item; `null` before the first run. */
  rows: DataGeneratorResultRow[] | null;
  seed: number | null;
};

/**
 * Summary of a data generator run: counts per item, the seed that reproduces it
 * and the translated error codes of the skipped records (without repetition
 * across rows). Each generator only passes its own rows.
 */
export function DataGeneratorResult({ rows, seed }: DataGeneratorResultProps) {
  if (!rows) {
    return (
      <EmptyListState
        title="Nenhuma execução ainda"
        subtitle="Escolha o que criar e clique em Gerar dados: o resumo da execução aparece aqui."
      />
    );
  }

  const errorCodes = [...new Set(rows.flatMap((row) => row.summary.errors))];

  return (
    <section className="space-y-4" aria-label="Resultado da execução">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground">Resultado da execução</h4>
        {seed !== null ? (
          <Badge variant="secondary" className="px-2.5 py-1 text-[13px] font-semibold">
            Semente: {seed}
          </Badge>
        ) : null}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead className="text-right">Solicitados</TableHead>
            <TableHead className="text-right">Criados</TableHead>
            <TableHead className="text-right">Ignorados</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ label, summary }) => (
            <TableRow key={label}>
              <TableCell className="font-medium">{label}</TableCell>
              <TableCell className="text-right tabular-nums">{summary.requested}</TableCell>
              <TableCell className="text-right tabular-nums">{summary.created}</TableCell>
              <TableCell className="text-right tabular-nums">{summary.skipped}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {errorCodes.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Erros dos registros ignorados</p>
          <ul className="list-disc space-y-1 pl-5 text-red-600 dark:text-red-400">
            {errorCodes.map((code) => (
              <li key={code}>
                <FormErrorMessage size="sm">{getErrorMessage(code)}</FormErrorMessage>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
