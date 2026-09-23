/**
 * Static catalog of installment plan templates (data only, no logic).
 *
 * - Every `name` has 2..100 characters (`MovementName` limits).
 * - Every template is an expense: there is no `direction` field and the planner
 *   fills `'OUT'`.
 * - `totalRange` is the **total** value in reais; the planner draws a total and
 *   divides it by the drawn number of installments.
 * - `installmentsRange` stays within `DEV_DATA_LIMITS.minInstallments` (2) and
 *   `DEV_DATA_LIMITS.maxInstallmentsPlanned` (24).
 * - `weight` drives the draw.
 * - `categoryHint` is the **exact** name of a default subcategory (see
 *   `default-categories.constant.ts` in the category module). There is no
 *   default subcategory for appliances, electronics or furniture, so those
 *   templates use the closest existing one. This module does not import
 *   `@poupig/category`.
 */
export interface InstallmentPlanTemplate {
  readonly name: string;
  readonly totalRange: { readonly min: number; readonly max: number };
  readonly installmentsRange: { readonly min: number; readonly max: number };
  readonly weight: number;
  readonly categoryHint: string;
}

export const INSTALLMENT_PLANS_CATALOG: readonly InstallmentPlanTemplate[] = [
  { name: 'Geladeira', totalRange: { min: 2500, max: 7000 }, installmentsRange: { min: 6, max: 12 }, weight: 3, categoryHint: 'Manutenção e Reparos' },
  { name: 'Sofá', totalRange: { min: 1800, max: 6000 }, installmentsRange: { min: 4, max: 12 }, weight: 2, categoryHint: 'Manutenção e Reparos' },
  { name: 'Notebook', totalRange: { min: 3000, max: 9000 }, installmentsRange: { min: 6, max: 12 }, weight: 3, categoryHint: 'Material Didático' },
  { name: 'Curso de inglês', totalRange: { min: 1500, max: 6000 }, installmentsRange: { min: 6, max: 18 }, weight: 2, categoryHint: 'Cursos e Idiomas' },
  { name: 'IPVA', totalRange: { min: 900, max: 4500 }, installmentsRange: { min: 2, max: 5 }, weight: 2, categoryHint: 'IPVA' },
  { name: 'IPTU', totalRange: { min: 800, max: 5000 }, installmentsRange: { min: 2, max: 10 }, weight: 2, categoryHint: 'IPTU' },
  { name: 'Passagens de férias', totalRange: { min: 2000, max: 9000 }, installmentsRange: { min: 3, max: 10 }, weight: 2, categoryHint: 'Viagens' },
  { name: 'Celular novo', totalRange: { min: 1500, max: 8000 }, installmentsRange: { min: 6, max: 24 }, weight: 3, categoryHint: 'Telefone Celular' },
  { name: 'Tratamento dentário', totalRange: { min: 1200, max: 8000 }, installmentsRange: { min: 3, max: 12 }, weight: 1, categoryHint: 'Consultas e Exames' },
] as const;
