'use client';

import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { formatCurrency } from '@/shared/components/ui/money-input';
import { cn } from '@/shared/lib/class-name.util';
import {
  RECURRENCE_TOTAL_LINE_IDS,
  type RecurrenceChartLine,
  type RecurrenceChartSection,
  type RecurrenceChartSectionId,
} from '../data/recurrence-chart';

export type RecurrenceChartLegendProps = {
  sections: RecurrenceChartSection[];
  hiddenCount: number;
  highlightedLineId: string | null;
  onToggle: (lineId: string) => void;
  onToggleSection: (sectionId: RecurrenceChartSectionId) => void;
  onShowAll: () => void;
  onHighlight: (lineId: string | null) => void;
};

/** The sign of the total line is shown only by color; the other totals are magnitudes. */
function totalClassName(line: RecurrenceChartLine) {
  if (line.id !== RECURRENCE_TOTAL_LINE_IDS.result) return 'text-zinc-100';
  return line.total >= 0 ? 'text-emerald-400' : 'text-rose-400';
}

function LegendItem({
  line,
  isHighlighted,
  onToggle,
  onHighlight,
}: {
  line: RecurrenceChartLine;
  isHighlighted: boolean;
  onToggle: (lineId: string) => void;
  onHighlight: (lineId: string | null) => void;
}) {
  const action = line.kind === 'total' ? 'a linha' : 'a recorrência';

  return (
    <li>
      <button
        type="button"
        aria-pressed={line.isOn}
        title={line.isOn ? `Desabilitar ${action}` : `Habilitar ${action}`}
        onClick={() => onToggle(line.id)}
        onMouseEnter={() => onHighlight(line.isOn ? line.id : null)}
        onMouseLeave={() => onHighlight(null)}
        onFocus={() => onHighlight(line.isOn ? line.id : null)}
        onBlur={() => onHighlight(null)}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring',
          isHighlighted ? 'bg-white/6' : 'hover:bg-white/4',
          !line.isOn && 'opacity-45',
        )}
      >
        <span aria-hidden="true" className="flex w-5 shrink-0 items-center">
          <span
            className={cn('w-full', line.emphasis ? 'border-t-[3px]' : 'border-t-2', line.dashed && 'border-dashed')}
            style={{ borderColor: line.color }}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('block truncate text-zinc-200', !line.isOn && 'line-through')}>{line.label}</span>
          <span className="block truncate text-xs text-zinc-500">{line.description}</span>
        </span>
        <span className={cn('shrink-0 tabular-nums', totalClassName(line))}>{formatCurrency(line.total)}</span>
      </button>
    </li>
  );
}

/**
 * Title of a legend section and, at the same time, the switch of the whole
 * section: it turns every line off, or every line back on when the section is
 * already all off. `aria-pressed` is `mixed` while only part of it is on.
 */
function SectionToggle({
  section,
  onToggleSection,
}: {
  section: RecurrenceChartSection;
  onToggleSection: (sectionId: RecurrenceChartSectionId) => void;
}) {
  const turnsOn = section.state === 'off';
  const pressed = section.state === 'mixed' ? 'mixed' : section.state === 'on';

  return (
    <button
      type="button"
      aria-pressed={pressed}
      title={turnsOn ? `Habilitar o grupo ${section.label}` : `Desabilitar o grupo ${section.label}`}
      onClick={() => onToggleSection(section.id)}
      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1 text-left text-[11px] font-medium uppercase tracking-wide text-zinc-500 outline-none transition hover:bg-white/4 hover:text-zinc-300 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="min-w-0 flex-1 truncate">{section.label}</span>
      <span className="shrink-0 tabular-nums normal-case tracking-normal">
        {section.onCount}/{section.lines.length}
      </span>
      {turnsOn ? (
        <Eye aria-hidden="true" className="size-3.5 shrink-0" />
      ) : (
        <EyeOff aria-hidden="true" className="size-3.5 shrink-0" />
      )}
    </button>
  );
}

/**
 * The legend of the recurrence chart is also its control: every item turns its
 * line on and off. A recurrence item checks and unchecks the recurrence (the same
 * state of the table), while a summary item only shows or hides its line. An item
 * that is off stays listed, faded: it is the way back. The item keeps the color of
 * its line, which is why it is not a `FilterPill`. The title of each section turns
 * the whole section on and off.
 */
export function RecurrenceChartLegendComponent({
  sections,
  hiddenCount,
  highlightedLineId,
  onToggle,
  onToggleSection,
  onShowAll,
  onHighlight,
}: RecurrenceChartLegendProps) {
  return (
    <div className="flex min-h-0 flex-col gap-2">
      {hiddenCount > 0 ? (
        <Button type="button" variant="ghost" size="sm" onClick={onShowAll} className="self-start text-zinc-300">
          <Eye className="size-4" />
          Mostrar todas ({hiddenCount})
        </Button>
      ) : null}

      <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
        {sections.map((section) =>
          section.lines.length === 0 ? null : (
            <div key={section.id} className="space-y-1">
              <SectionToggle section={section} onToggleSection={onToggleSection} />
              <ul className="space-y-0.5" aria-label={section.label}>
                {section.lines.map((line) => (
                  <LegendItem
                    key={line.id}
                    line={line}
                    isHighlighted={line.id === highlightedLineId}
                    onToggle={onToggle}
                    onHighlight={onHighlight}
                  />
                ))}
              </ul>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
