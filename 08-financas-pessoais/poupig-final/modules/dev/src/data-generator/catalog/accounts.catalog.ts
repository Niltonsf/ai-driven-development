import { AccountTypeLiteral } from '../dto';

/**
 * Static catalog of accounts (data only, no logic).
 *
 * - Every `name` has 2..100 characters (`AccountName` limits) and is unique in
 *   the catalog, so a shuffled slice never repeats a name inside a plan.
 * - `type` is a string literal of `AccountType`: this module does not import
 *   `@poupig/account` nor any other domain module.
 * - `icon` is a `lucide-react` icon key (kebab-case) and `color` is `#RRGGBB`.
 * - The catalog has at least `DEV_DATA_LIMITS.maxAccounts` entries.
 */
export interface AccountCatalogEntry {
  readonly name: string;
  readonly type: AccountTypeLiteral;
  readonly financialInstitution: string;
  readonly icon: string;
  readonly color: string;
}

export const ACCOUNTS_CATALOG: readonly AccountCatalogEntry[] = [
  { name: 'Conta Corrente Itaú', type: 'CHECKING', financialInstitution: 'Itaú Unibanco', icon: 'landmark', color: '#EC7000' },
  { name: 'Poupança Caixa', type: 'SAVINGS', financialInstitution: 'Caixa Econômica Federal', icon: 'piggy-bank', color: '#005CA9' },
  { name: 'Carteira', type: 'CASH', financialInstitution: 'Dinheiro em espécie', icon: 'wallet', color: '#6B7280' },
  { name: 'Nubank', type: 'CHECKING', financialInstitution: 'Nu Pagamentos', icon: 'smartphone', color: '#820AD1' },
  { name: 'Conta Corrente Bradesco', type: 'CHECKING', financialInstitution: 'Banco Bradesco', icon: 'building-2', color: '#CC092F' },
  { name: 'Conta Santander', type: 'CHECKING', financialInstitution: 'Banco Santander', icon: 'landmark', color: '#EC0000' },
  { name: 'Poupança Banco do Brasil', type: 'SAVINGS', financialInstitution: 'Banco do Brasil', icon: 'piggy-bank', color: '#FAE128' },
  { name: 'Conta Inter', type: 'CHECKING', financialInstitution: 'Banco Inter', icon: 'smartphone', color: '#FF7A00' },
  { name: 'Investimentos XP', type: 'INVESTMENT', financialInstitution: 'XP Investimentos', icon: 'trending-up', color: '#111827' },
  { name: 'Tesouro Direto', type: 'INVESTMENT', financialInstitution: 'Tesouro Nacional', icon: 'coins', color: '#0F766E' },
  { name: 'Conta C6 Bank', type: 'CHECKING', financialInstitution: 'C6 Bank', icon: 'building', color: '#242424' },
  { name: 'Reserva de Emergência', type: 'SAVINGS', financialInstitution: 'Nubank', icon: 'shield-check', color: '#16A34A' },
  { name: 'Vale-Refeição', type: 'OTHER', financialInstitution: 'Alelo', icon: 'utensils', color: '#00A868' },
  { name: 'PicPay', type: 'CHECKING', financialInstitution: 'PicPay', icon: 'qr-code', color: '#21C25E' },
] as const;
