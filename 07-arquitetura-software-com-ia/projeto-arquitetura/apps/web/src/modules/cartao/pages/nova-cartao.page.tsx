'use client';

// Página de cadastro de novo cartão (rota `/cartao/nova`, grupo private).
//
// Responsável apenas pela composição: cabeçalho da seção + formulário em modo
// criação (sem DTO). A navegação é estado da aplicação e vive aqui — o
// formulário apenas avisa sucesso/cancelamento via callbacks.

import { useRouter } from 'next/navigation';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { CartaoForm } from '../components/cartao-form.component';

const CARTOES_ROUTE = '/cartao';

export function NovaCartaoPage() {
  const router = useRouter();
  const goToList = () => router.push(CARTOES_ROUTE);

  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        badge="Cartões"
        title="Novo cartão"
        subtitle="Cadastre um novo cartão para organizar suas finanças."
      />

      <CartaoForm onSuccess={goToList} onCancel={goToList} />
    </div>
  );
}
