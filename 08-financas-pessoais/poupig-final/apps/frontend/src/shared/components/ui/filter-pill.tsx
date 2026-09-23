import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/class-name.util';

/** Same visual language as the active item of the sidebar menu. */
const FILTER_PILL_ACTIVE_CLASS =
  'border-white/10 bg-linear-to-r from-white/10 via-white/6 to-zinc-800/70 text-zinc-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';
const FILTER_PILL_INACTIVE_CLASS = 'border-border/60 text-zinc-400 hover:bg-white/6 hover:text-zinc-100';

export type FilterPillProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'aria-pressed'> & {
  /** Selected state, announced through `aria-pressed`. */
  active?: boolean;
  /** Optional counter shown on the right. */
  count?: number;
};

/** Rounded selectable pill for filter groups. Presentation only. */
export function FilterPill({ active = false, count, className, children, ...props }: FilterPillProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        active ? FILTER_PILL_ACTIVE_CLASS : FILTER_PILL_INACTIVE_CLASS,
        className,
      )}
      {...props}
    >
      {children}
      {typeof count === 'number' ? (
        <span
          className={cn(
            'min-w-5 rounded-full px-1.5 text-center text-xs tabular-nums',
            active ? 'bg-white/15 text-zinc-50' : 'bg-white/8 text-zinc-300',
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}
