'use client';

// Página de edição de conta (rota `/contas/[id]/editar`, grupo private).
//
// Responsável pela composição: cabeçalho da seção + carregamento da conta
// selecionada + formulário em modo edição (com DTO). Reutiliza o MESMO
// `ContaForm` da criação — a presença do DTO faz o formulário operar em modo
// edição e o submit atualizar o registro pelo `id`.
//
// O formulário só é montado DEPOIS que a conta carrega: o React Hook Form
// aplica `defaultValues` apenas na montagem, então montá-lo com a conta já em
// mãos garante o pré-preenchimento sem precisar de `reset`/efeitos extras. A
// navegação é estado da aplicação e vive aqui — o formulário só avisa
// sucesso/cancelamento via callbacks.

import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { ContaForm } from '../components/conta-form.component';
import { useConta } from '../data/use-conta.hook';

const CONTAS_ROUTE = '/contas';

export function EditarContaPage({ contaId }: { contaId: string }) {
  const router = useRouter();
  const goToList = () => router.push(CONTAS_ROUTE);
  const { conta, isLoading, error, refetch } = useConta(contaId);

  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        badge="Contas"
        title="Editar conta"
        subtitle="Atualize os dados da conta selecionada."
      />

      {isLoading ? <LoadingState /> : null}

      {!isLoading && error ? <ErrorState message={error} onRetry={refetch} /> : null}

      {!isLoading && !error && conta ? (
        <ContaForm conta={conta} onSuccess={goToList} onCancel={goToList} />
      ) : null}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-10 w-full animate-pulse rounded-md bg-white/10" />
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <AlertCircle className="size-8 text-destructive" />
      <div className="space-y-1">
        <p className="font-medium">Não foi possível carregar a conta</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="size-4" />
        Tentar novamente
      </Button>
    </div>
  );
}
