import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { ContasComponent } from '../components/contas.component';

/**
 * Página de consulta de contas (rota `/contas`, grupo private).
 *
 * Responsável apenas pela composição: cabeçalho da seção + listagem. Toda a
 * lógica de dados vive em `data/` e a renderização em `components/`.
 */
export function ContasPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        badge="Contas"
        title="Contas"
        subtitle="Gerencie as contas cadastradas na aplicação."
      />

      <ContasComponent />
    </div>
  );
}
