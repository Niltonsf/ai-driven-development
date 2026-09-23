'use client';

import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { EmptyListState } from '@/shared/components/ui/empty-list-state';
import { FormErrorMessage } from '@/shared/components/ui/form-error-message';
import { FormSkeleton } from '@/shared/components/ui/form-skeleton';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { SeriesDataGenerator } from '../components/series-data-generator.component';
import { TransactionDataGenerator } from '../components/transaction-data-generator.component';
import { DEV_TOOLS_ENABLED } from '../data/dev-tools.env';
import { useDataGeneratorStatus } from '../data/use-data-generator';

function PageContainer({ children }: { children: ReactNode }) {
  return <div className="w-full space-y-6">{children}</div>;
}

/**
 * `/dev`: data generators of the development environment. No guard here: the
 * `(private)` layout already requires authentication, and availability comes
 * from the frontend switch plus the backend status.
 */
export function DataGeneratorPage() {
  const { status, error } = useDataGeneratorStatus();

  if (!DEV_TOOLS_ENABLED || status === 'disabled') {
    return (
      <PageContainer>
        <EmptyListState
          title="Recurso indisponível"
          subtitle="O gerador de massa de dados só fica disponível em ambiente de desenvolvimento."
        />
      </PageContainer>
    );
  }

  if (status === 'loading') {
    return (
      <PageContainer>
        <FormSkeleton sections={3} rowsPerSection={2} />
      </PageContainer>
    );
  }

  if (status === 'error') {
    return (
      <PageContainer>
        <FormErrorMessage size="sm">{error ?? 'Erro ao consultar a disponibilidade do gerador.'}</FormErrorMessage>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageSectionHeader badge="Desenvolvimento" title="Gerador de Massa de Dados" />

      <div
        role="note"
        className="flex gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground"
      >
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          Os dados são gravados na conta do usuário logado. Transações de dias anteriores a hoje nascem efetivadas e
          as de hoje até o fim do mês, pendentes. Aplique as categorias padrão antes de gerar para que as transações
          ganhem categoria.
        </p>
      </div>

      {/* One card per generator, each one independent: one-off transactions, then series and installment plans. */}
      <div className="space-y-6">
        <TransactionDataGenerator />
        <SeriesDataGenerator />
      </div>
    </PageContainer>
  );
}
