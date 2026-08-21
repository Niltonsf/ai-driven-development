import Link from 'next/link';
import { ArrowRight, Lightbulb, Tags, Workflow } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type QuickAction = {
  label: string;
  href: string;
  icon: LucideIcon;
};

// As tres rotas de criacao existem (specs 005/007/011):
// /idea-types/new, /ideas/new, /processings/new — confirmado na implementacao.
const ACTIONS: QuickAction[] = [
  { label: 'Nova ideia', href: '/ideas/new', icon: Lightbulb },
  { label: 'Novo tipo de ideia', href: '/idea-types/new', icon: Tags },
  { label: 'Novo processamento', href: '/processings/new', icon: Workflow },
];

export function DashboardQuickActions() {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-100">Acesso rápido</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ACTIONS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:bg-white/[0.08]"
          >
            <Icon className="size-5 shrink-0 text-zinc-400" />
            <span className="flex-1 text-sm font-medium text-zinc-200">
              {label}
            </span>
            <ArrowRight className="size-4 shrink-0 text-zinc-500" />
          </Link>
        ))}
      </div>
    </section>
  );
}
