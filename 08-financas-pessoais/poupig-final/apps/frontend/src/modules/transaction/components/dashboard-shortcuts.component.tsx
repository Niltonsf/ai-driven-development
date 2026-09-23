import Link from 'next/link';
import { ArrowUpRight, CreditCard, ReceiptText, Tags, Wallet } from 'lucide-react';
import { cn } from '@/shared/lib/class-name.util';
import { DASHBOARD_CARD_CLASSES } from './dashboard-card.styles';

/** Same destinations and icons of the menu items. */
const DASHBOARD_SHORTCUTS = [
  {
    href: '/transactions',
    title: 'Extrato Mensal',
    description: 'Lançamentos do mês, com filtros e agrupamentos.',
    Icon: ReceiptText,
    iconClassName: 'border-blue-500/25 bg-blue-500/10 text-blue-400',
  },
  {
    href: '/accounts',
    title: 'Contas',
    description: 'Contas bancárias, carteiras e investimentos.',
    Icon: Wallet,
    iconClassName: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
  },
  {
    href: '/cards',
    title: 'Cartões',
    description: 'Cartões de crédito usados nas compras.',
    Icon: CreditCard,
    iconClassName: 'border-violet-500/25 bg-violet-500/10 text-violet-400',
  },
  {
    href: '/categories',
    title: 'Categorias',
    description: 'Categorias e subcategorias dos lançamentos.',
    Icon: Tags,
    iconClassName: 'border-amber-500/25 bg-amber-500/10 text-amber-400',
  },
] as const;

/** Shortcuts to the everyday screens. */
export function DashboardShortcutsComponent() {
  return (
    <section aria-label="Atalhos" className="space-y-3">
      <h3 className="text-sm font-medium text-zinc-400">Atalhos</h3>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DASHBOARD_SHORTCUTS.map(({ href, title, description, Icon, iconClassName }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              DASHBOARD_CARD_CLASSES,
              'group flex items-center gap-4 rounded-xl p-4 transition-all duration-300',
              'hover:-translate-y-0.5 hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl border', iconClassName)}>
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-zinc-100">{title}</span>
              <span className="block truncate text-xs text-zinc-400">{description}</span>
            </span>
            <ArrowUpRight
              className="size-4 shrink-0 text-zinc-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zinc-200"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
