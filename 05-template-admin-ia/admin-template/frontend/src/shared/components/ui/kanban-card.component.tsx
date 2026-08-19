import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export interface KanbanCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  cover?: ReactNode;
  badges?: ReactNode;
  meta?: ReactNode;
  footer?: ReactNode;
}

export const KanbanCard = forwardRef<HTMLDivElement, KanbanCardProps>(
  ({ title, description, cover, badges, meta, footer, className, ...props }, ref) => (
    <article
      ref={ref}
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-ui-card-border bg-white p-4 shadow-ui-xs transition hover:shadow-ui-card",
        className,
      )}
      {...props}
    >
      {cover ? <div className="overflow-hidden rounded-lg">{cover}</div> : null}
      {badges ? <div className="flex flex-wrap items-center gap-1.5">{badges}</div> : null}
      <div className="flex flex-col gap-1">
        <h4 className="text-sm font-semibold text-ui-gray-800">{title}</h4>
        {description ? (
          <p className="text-xs text-ui-gray-500">{description}</p>
        ) : null}
      </div>
      {meta ? (
        <div className="flex flex-wrap items-center gap-3 text-xs text-ui-gray-500">
          {meta}
        </div>
      ) : null}
      {footer ? (
        <div className="flex items-center justify-between border-t border-ui-card-border pt-3">
          {footer}
        </div>
      ) : null}
    </article>
  ),
);
KanbanCard.displayName = "KanbanCard";

export const KanbanColumn = forwardRef<
  HTMLDivElement,
  Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
    title: string;
    count?: number;
    trailing?: ReactNode;
  }
>(({ title, count, trailing, children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col gap-3 rounded-2xl border border-ui-kanban-columnBorder bg-ui-kanban-columnBg p-4",
      className,
    )}
    {...props}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-ui-gray-800">{title}</h3>
        {typeof count === "number" ? (
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-ui-gray-500">
            {count}
          </span>
        ) : null}
      </div>
      {trailing}
    </div>
    <div className="flex flex-col gap-3">{children}</div>
  </div>
));
KanbanColumn.displayName = "KanbanColumn";
