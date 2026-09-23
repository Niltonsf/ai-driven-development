'use client';

import { Eye } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { LucideIconByKey, pickSmartIconColor } from '@/shared/components/ui/lucide-icon-by-key';
import { formatCurrency } from '@/shared/components/ui/money-input';
import { cn } from '@/shared/lib/class-name.util';
import {
  formatSpendingShare,
  groupSpendingSlices,
  shareOf,
  type CategorySpendingGrain,
  type SpendingSliceItem,
} from '../data/category-spending-slices';

export type CategorySpendingLegendProps = {
  grain: CategorySpendingGrain;
  slices: SpendingSliceItem[];
  /** Total of the slices turned on: the percentages are always over what is visible. */
  visibleTotal: number;
  hiddenCount: number;
  highlightedId: string | null;
  onToggle: (id: string) => void;
  onShowAll: () => void;
  onHighlight: (id: string | null) => void;
};

function LegendItem({
  slice,
  visibleTotal,
  isHighlighted,
  onToggle,
  onHighlight,
}: {
  slice: SpendingSliceItem;
  visibleTotal: number;
  isHighlighted: boolean;
  onToggle: (id: string) => void;
  onHighlight: (id: string | null) => void;
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={!slice.isHidden}
        title={slice.isHidden ? 'Mostrar no gráfico' : 'Ocultar do gráfico'}
        onClick={() => onToggle(slice.id)}
        onMouseEnter={() => onHighlight(slice.id)}
        onMouseLeave={() => onHighlight(null)}
        onFocus={() => onHighlight(slice.id)}
        onBlur={() => onHighlight(null)}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring',
          isHighlighted ? 'bg-white/6' : 'hover:bg-white/4',
          slice.isHidden && 'opacity-45',
        )}
      >
        {slice.icon ? (
          <LucideIconByKey
            name={slice.icon}
            size={14}
            circleSize={26}
            withBackgroundCircle
            backgroundColor={slice.color}
            iconColor={pickSmartIconColor(slice.color)}
            className="border-transparent"
          />
        ) : (
          <span className="flex size-6.5 shrink-0 items-center justify-center" aria-hidden="true">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-zinc-200">{slice.label}</span>
        <span className="shrink-0 tabular-nums text-zinc-100">{formatCurrency(slice.total)}</span>
        <span className="w-10 shrink-0 text-right text-xs tabular-nums text-zinc-400">
          {slice.isHidden ? null : formatSpendingShare(shareOf(slice.total, visibleTotal))}
        </span>
      </button>
    </li>
  );
}

/**
 * The legend of the donut is also its control: each item turns its slice on and
 * off, and it is the way back for a slice hidden by clicking the chart. The item
 * keeps the color of the slice (it is data, the category color), which is why it is
 * not a `FilterPill`. In the subcategory grain the items are grouped under the name
 * of the owning category, in the order of the slices.
 */
export function CategorySpendingLegendComponent({
  grain,
  slices,
  visibleTotal,
  hiddenCount,
  highlightedId,
  onToggle,
  onShowAll,
  onHighlight,
}: CategorySpendingLegendProps) {
  const groups = grain === 'subcategory' ? groupSpendingSlices(slices) : [{ parentLabel: null, slices }];

  return (
    <div className="flex min-h-0 flex-col gap-2">
      {hiddenCount > 0 ? (
        <Button type="button" variant="ghost" size="sm" onClick={onShowAll} className="self-start text-zinc-300">
          <Eye className="size-4" />
          Mostrar todas ({hiddenCount})
        </Button>
      ) : null}

      <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
        {groups.map((group, index) => (
          <div key={`${group.parentLabel ?? ''}-${index}`} className="space-y-1">
            {group.parentLabel ? (
              <p className="px-2.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                {group.parentLabel}
              </p>
            ) : null}
            <ul className="space-y-0.5" aria-label={group.parentLabel ?? undefined}>
              {group.slices.map((slice) => (
                <LegendItem
                  key={slice.id}
                  slice={slice}
                  visibleTotal={visibleTotal}
                  isHighlighted={slice.id === highlightedId}
                  onToggle={onToggle}
                  onHighlight={onHighlight}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
