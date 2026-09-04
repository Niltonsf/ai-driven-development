'use client';

// Página de cadastro de nova conta (rota `/contas/nova`, grupo private).
//
// Responsável apenas pela composição: cabeçalho da seção + formulário em modo
// criação (sem DTO). A navegação é estado da aplicação e vive aqui — o
// formulário apenas avisa sucesso/cancelamento via callbacks.

import { useRouter } from 'next/navigation';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { ContaForm } from '../components/conta-form.component';

const CONTAS_ROUTE = '/contas';

export function NovaContaPage() {
  const router = useRouter();
  const goToList = () => router.push(CONTAS_ROUTE);

  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        badge="Contas"
        title="Nova conta"
        subtitle="Cadastre uma nova conta para organizar suas finanças."
      />

      <ContaForm onSuccess={goToList} onCancel={goToList} />
    </div>
  );
}
