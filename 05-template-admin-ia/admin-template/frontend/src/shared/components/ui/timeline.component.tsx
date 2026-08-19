import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export interface TimelineItem {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  time?: string;
  icon?: ReactNode;
}

export interface TimelineProps extends HTMLAttributes<HTMLOListElement> {
  items: TimelineItem[];
}

export const Timeline = forwardRef<HTMLOListElement, TimelineProps>(
  ({ items, className, ...props }, ref) => (
    <ol ref={ref} className={cn("relative ml-2 flex flex-col gap-6", className)} {...props}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <li key={item.id} className="relative pl-8">
            <span
              className="absolute left-0 top-0 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-ui-timeline-dot text-xs font-medium text-white"
              aria-hidden="true"
            >
              {item.icon ?? idx + 1}
            </span>
            {!isLast ? (
              <span
                className="absolute left-0 top-6 h-[calc(100%+1.5rem)] w-px -translate-x-1/2 bg-ui-timeline-line"
                aria-hidden="true"
              />
            ) : null}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-ui-gray-800">{item.title}</div>
                {item.time ? (
                  <span className="text-xs text-ui-gray-500">{item.time}</span>
                ) : null}
              </div>
              {item.description ? (
                <div className="text-sm text-ui-gray-500">{item.description}</div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  ),
);
Timeline.displayName = "Timeline";
