import { DirectionLiteral, FrequencyUnitLiteral } from '../dto';

/**
 * Static catalog of recurrence templates (data only, no logic).
 *
 * - Every `name` has 2..100 characters (`MovementName` limits).
 * - `direction` and `unit` are string literals of `Direction` and
 *   `FrequencyUnit`: this module does not import `@poupig/transaction`.
 * - `valueRange` is in reais, per occurrence.
 * - `weight` drives the draw and, since the unit comes from the template, also
 *   how many recurrences fall in each unit: `MONTH` weights add up to more than
 *   `WEEK` and `YEAR` together, and `YEAR` weights add up to less than `WEEK`.
 * - `categoryHint` rules: every `OUT` template carries the **exact** name of a
 *   default subcategory (see `default-categories.constant.ts` in the category
 *   module); every `IN` template carries `null`, because there is no default
 *   income category. When a template has no subcategory of its own, it uses the
 *   closest existing one. This module does not import `@poupig/category`.
 */
export interface RecurrenceTemplate {
  readonly name: string;
  readonly direction: DirectionLiteral;
  readonly valueRange: { readonly min: number; readonly max: number };
  readonly weight: number;
  readonly unit: FrequencyUnitLiteral;
  readonly categoryHint: string | null;
}

export const RECURRENCES_CATALOG: readonly RecurrenceTemplate[] = [
  // Monthly expenses (OUT)
  { name: 'Conta de energia', direction: 'OUT', valueRange: { min: 120, max: 480 }, weight: 5, unit: 'MONTH', categoryHint: 'Energia Elétrica' },
  { name: 'Água', direction: 'OUT', valueRange: { min: 60, max: 220 }, weight: 4, unit: 'MONTH', categoryHint: 'Água e Esgoto' },
  { name: 'Internet', direction: 'OUT', valueRange: { min: 99, max: 250 }, weight: 4, unit: 'MONTH', categoryHint: 'Internet e TV' },
  { name: 'Condomínio', direction: 'OUT', valueRange: { min: 350, max: 1200 }, weight: 3, unit: 'MONTH', categoryHint: 'Condomínio' },
  { name: 'Aluguel', direction: 'OUT', valueRange: { min: 1200, max: 3800 }, weight: 3, unit: 'MONTH', categoryHint: 'Aluguel ou Financiamento' },
  { name: 'Escola das crianças', direction: 'OUT', valueRange: { min: 900, max: 2800 }, weight: 2, unit: 'MONTH', categoryHint: 'Mensalidade Escolar' },
  { name: 'Escola do João', direction: 'OUT', valueRange: { min: 700, max: 2200 }, weight: 1, unit: 'MONTH', categoryHint: 'Mensalidade Escolar' },
  { name: 'Balé da Fernanda', direction: 'OUT', valueRange: { min: 150, max: 380 }, weight: 2, unit: 'MONTH', categoryHint: 'Cursos e Idiomas' },
  { name: 'Inglês das crianças', direction: 'OUT', valueRange: { min: 250, max: 600 }, weight: 1, unit: 'MONTH', categoryHint: 'Cursos e Idiomas' },
  { name: 'Academia', direction: 'OUT', valueRange: { min: 90, max: 250 }, weight: 3, unit: 'MONTH', categoryHint: 'Academia e Bem-estar' },
  { name: 'Plano de saúde', direction: 'OUT', valueRange: { min: 450, max: 1600 }, weight: 3, unit: 'MONTH', categoryHint: 'Plano de Saúde' },
  { name: 'Streaming', direction: 'OUT', valueRange: { min: 25, max: 80 }, weight: 4, unit: 'MONTH', categoryHint: 'Cinema e Streaming' },
  { name: 'Celular', direction: 'OUT', valueRange: { min: 45, max: 150 }, weight: 3, unit: 'MONTH', categoryHint: 'Telefone Celular' },

  // Weekly expenses (OUT)
  { name: 'Diarista', direction: 'OUT', valueRange: { min: 150, max: 250 }, weight: 2, unit: 'WEEK', categoryHint: 'Serviços Domésticos' },
  { name: 'Feira da semana', direction: 'OUT', valueRange: { min: 50, max: 180 }, weight: 2, unit: 'WEEK', categoryHint: 'Feira' },

  // Yearly expenses (OUT)
  { name: 'Domínio do site', direction: 'OUT', valueRange: { min: 40, max: 120 }, weight: 1, unit: 'YEAR', categoryHint: 'Assinaturas Digitais' },
  { name: 'Seguro do carro', direction: 'OUT', valueRange: { min: 1800, max: 4800 }, weight: 1, unit: 'YEAR', categoryHint: 'Seguro do Veículo' },

  // Monthly income (IN)
  { name: 'Salário', direction: 'IN', valueRange: { min: 3500, max: 12000 }, weight: 4, unit: 'MONTH', categoryHint: null },
  { name: 'Aluguel recebido', direction: 'IN', valueRange: { min: 900, max: 2800 }, weight: 1, unit: 'MONTH', categoryHint: null },
] as const;
