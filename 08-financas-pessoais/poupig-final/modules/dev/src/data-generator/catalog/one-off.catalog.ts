import { DirectionLiteral } from '../dto';

/**
 * Static catalog of one-off transaction templates (data only, no logic).
 *
 * - Every `name` has 2..100 characters (`MovementName` limits).
 * - `direction` is a string literal of `Direction`; `valueRange` is in reais.
 * - `weight` drives the draw: everyday expenses (market, bakery) weigh more
 *   than rare ones (car service, insurance payment).
 * - `categoryHint` rules: every `OUT` template carries the **exact** name of a
 *   default subcategory (see `default-categories.constant.ts` in the category
 *   module); every `IN` template carries `null`, because there is no default
 *   income category. The backend matches the hint by name against the user's
 *   active subcategories. This module does not import `@poupig/category`.
 */
export interface OneOffTemplate {
  readonly name: string;
  readonly direction: DirectionLiteral;
  readonly valueRange: { readonly min: number; readonly max: number };
  readonly weight: number;
  readonly categoryHint: string | null;
}

export const ONE_OFF_CATALOG: readonly OneOffTemplate[] = [
  // Expenses (OUT)
  { name: 'Mercado', direction: 'OUT', valueRange: { min: 80, max: 650 }, weight: 10, categoryHint: 'Supermercado' },
  { name: 'Padaria', direction: 'OUT', valueRange: { min: 8, max: 45 }, weight: 9, categoryHint: 'Padaria' },
  { name: 'Restaurante', direction: 'OUT', valueRange: { min: 45, max: 280 }, weight: 7, categoryHint: 'Restaurantes e Delivery' },
  { name: 'Delivery de comida', direction: 'OUT', valueRange: { min: 35, max: 140 }, weight: 6, categoryHint: 'Restaurantes e Delivery' },
  { name: 'Uber', direction: 'OUT', valueRange: { min: 12, max: 65 }, weight: 7, categoryHint: 'Aplicativos de Transporte' },
  { name: 'Combustível', direction: 'OUT', valueRange: { min: 120, max: 380 }, weight: 5, categoryHint: 'Combustível' },
  { name: 'Farmácia', direction: 'OUT', valueRange: { min: 25, max: 220 }, weight: 5, categoryHint: 'Farmácia' },
  { name: 'Feira', direction: 'OUT', valueRange: { min: 40, max: 160 }, weight: 3, categoryHint: 'Feira' },
  { name: 'Estacionamento', direction: 'OUT', valueRange: { min: 10, max: 45 }, weight: 3, categoryHint: 'Estacionamento e Pedágio' },
  { name: 'Corte de cabelo', direction: 'OUT', valueRange: { min: 40, max: 120 }, weight: 2, categoryHint: 'Cabeleireiro e Estética' },
  { name: 'Cinema', direction: 'OUT', valueRange: { min: 40, max: 120 }, weight: 2, categoryHint: 'Cinema e Streaming' },
  { name: 'Presente de aniversário', direction: 'OUT', valueRange: { min: 80, max: 450 }, weight: 2, categoryHint: 'Presentes' },
  { name: 'Compra de roupas', direction: 'OUT', valueRange: { min: 90, max: 600 }, weight: 2, categoryHint: 'Roupas' },
  { name: 'Ração do pet', direction: 'OUT', valueRange: { min: 90, max: 320 }, weight: 2, categoryHint: 'Ração e Petiscos' },
  { name: 'Consulta médica', direction: 'OUT', valueRange: { min: 150, max: 600 }, weight: 1, categoryHint: 'Consultas e Exames' },
  { name: 'Compra de livro', direction: 'OUT', valueRange: { min: 40, max: 150 }, weight: 1, categoryHint: 'Livros' },
  { name: 'Conserto do chuveiro', direction: 'OUT', valueRange: { min: 150, max: 900 }, weight: 1, categoryHint: 'Manutenção e Reparos' },
  { name: 'Passagem aérea', direction: 'OUT', valueRange: { min: 450, max: 2800 }, weight: 1, categoryHint: 'Viagens' },
  { name: 'Revisão do carro', direction: 'OUT', valueRange: { min: 600, max: 2500 }, weight: 1, categoryHint: 'Manutenção do Veículo' },
  { name: 'Pagamento do seguro', direction: 'OUT', valueRange: { min: 1200, max: 4200 }, weight: 1, categoryHint: 'Seguro do Veículo' },

  // Income (IN)
  { name: 'Freelance', direction: 'IN', valueRange: { min: 800, max: 4500 }, weight: 3, categoryHint: null },
  { name: 'Venda de item usado', direction: 'IN', valueRange: { min: 60, max: 1500 }, weight: 2, categoryHint: null },
  { name: 'Reembolso', direction: 'IN', valueRange: { min: 30, max: 600 }, weight: 2, categoryHint: null },
  { name: 'Salário extra', direction: 'IN', valueRange: { min: 1000, max: 5000 }, weight: 1, categoryHint: null },
] as const;
