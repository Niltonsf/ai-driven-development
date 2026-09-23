import Link from 'next/link';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/class-name.util';
import { DASHBOARD_CARD_CLASSES } from './dashboard-card.styles';

export type DashboardOnboardingProps = {
  hasAccounts: boolean;
  hasActiveCategories: boolean;
  hasTransactions: boolean;
};

type OnboardingStep = {
  href: string;
  title: string;
  description: string;
  isDone: boolean;
};

/** First steps guide, shown only while some base registration is missing. */
export function DashboardOnboardingComponent({
  hasAccounts,
  hasActiveCategories,
  hasTransactions,
}: DashboardOnboardingProps) {
  const steps: OnboardingStep[] = [
    {
      href: '/accounts',
      title: 'Cadastrar a primeira conta',
      description: 'Onde o dinheiro entra e sai.',
      isDone: hasAccounts,
    },
    {
      href: '/categories',
      title: 'Aplicar as categorias padrão',
      description: 'Para saber para onde vão os gastos.',
      isDone: hasActiveCategories,
    },
    {
      href: '/transactions',
      title: 'Registrar a primeira transação',
      description: 'O primeiro lançamento deste mês.',
      isDone: hasTransactions,
    },
  ];

  const doneCount = steps.filter((step) => step.isDone).length;
  if (doneCount === steps.length) return null;

  return (
    <Card className={cn(DASHBOARD_CARD_CLASSES, 'p-5')}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,0.18),transparent_45%)]"
      />
      <div className="relative flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl border border-blue-500/25 bg-blue-500/10 text-blue-400">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Primeiros passos</h3>
              <p className="text-xs text-zinc-400">Complete a base para acompanhar o seu mês.</p>
            </div>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium tabular-nums text-zinc-300">
            {doneCount} de {steps.length} concluídos
          </span>
        </div>

        <ol className="grid gap-3 md:grid-cols-3">
          {steps.map((step, index) => {
            const content = (
              <>
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
                    step.isDone
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                      : 'border-white/15 bg-white/5 text-zinc-300',
                  )}
                >
                  {step.isDone ? <Check className="size-4" aria-hidden="true" /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block text-sm font-medium',
                      step.isDone ? 'text-zinc-500 line-through' : 'text-zinc-100',
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="block text-xs text-zinc-500">{step.description}</span>
                </span>
              </>
            );

            return (
              <li key={step.href}>
                {step.isDone ? (
                  <span className="flex h-full items-center gap-3 rounded-xl border border-white/6 bg-white/2 p-3">
                    {content}
                    <span className="sr-only"> (feito)</span>
                  </span>
                ) : (
                  <Link
                    href={step.href}
                    className="group flex h-full items-center gap-3 rounded-xl border border-white/10 bg-white/4 p-3 transition-colors hover:border-blue-500/40 hover:bg-blue-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {content}
                    <ArrowRight
                      className="size-4 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-400"
                      aria-hidden="true"
                    />
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </Card>
  );
}
