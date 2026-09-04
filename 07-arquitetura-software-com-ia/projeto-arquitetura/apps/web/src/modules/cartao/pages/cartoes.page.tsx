import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { CartoesComponent } from '../components/cartoes.component';

/**
 * Página de consulta de cartões (rota `/cartao`, grupo private).
 *
 * Responsável apenas pela composição: cabeçalho da seção + listagem. Toda a
 * lógica de dados vive em `data/` e a renderização em `components/`.
 */
export function CartoesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        badge="Cartões"
        title="Cartões"
        subtitle="Gerencie os cartões cadastrados na aplicação."
      />

      <CartoesComponent />
    </div>
  );
}
