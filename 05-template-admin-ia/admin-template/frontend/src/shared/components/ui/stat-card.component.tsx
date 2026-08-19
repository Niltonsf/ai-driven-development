import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  /** Delta string e.g. "11.01%". */
  delta?: string;
  deltaTrend?: "up" | "down";
}

const ArrowUp = (
  <svg className="fill-current" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.56462 1.62393C5.70193 1.47072 5.90135 1.37432 6.12329 1.37432C6.31631 1.37415 6.50845 1.44731 6.65505 1.59381L9.65514 4.5918C9.94814 4.88459 9.94831 5.35947 9.65552 5.65246C9.36273 5.94546 8.88785 5.94562 8.59486 5.65283L6.87329 3.93247L6.87329 10.125C6.87329 10.5392 6.53751 10.875 6.12329 10.875C5.70908 10.875 5.37329 10.5392 5.37329 10.125L5.37329 3.93578L3.65516 5.65282C3.36218 5.94562 2.8873 5.94547 2.5945 5.65248C2.3017 5.35949 2.30185 4.88462 2.59484 4.59182L5.56462 1.62393Z"
    />
  </svg>
);

const ArrowDown = (
  <svg className="fill-current" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.31462 10.3761C5.45194 10.5293 5.65136 10.6257 5.87329 10.6257C6.0663 10.6259 6.25845 10.5527 6.40505 10.4062L9.40514 7.4082C9.69814 7.11541 9.69831 6.64054 9.40552 6.34754C9.11273 6.05454 8.63785 6.05438 8.34486 6.34717L6.62329 8.06753L6.62329 1.875C6.62329 1.46079 6.28751 1.125 5.87329 1.125C5.45908 1.125 5.12329 1.46079 5.12329 1.875L5.12329 8.06422L3.40516 6.34719C3.11218 6.05439 2.6373 6.05454 2.3445 6.34752C2.0517 6.64051 2.05185 7.11538 2.34484 7.40818L5.31462 10.3761Z"
    />
  </svg>
);

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ icon, label, value, delta, deltaTrend = "up", className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-ui-card-border bg-ui-card-bg p-5 md:p-6",
        className,
      )}
      {...props}
    >
      {icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ui-gray-100 text-ui-gray-800">
          {icon}
        </div>
      ) : null}
      <div className="mt-5 flex items-end justify-between">
        <div>
          <span className="text-sm text-ui-gray-500">{label}</span>
          <h4 className="mt-2 text-xl font-bold text-ui-gray-800">{value}</h4>
        </div>
        {delta ? (
          <span
            className={cn(
              "flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2.5 text-sm font-medium",
              deltaTrend === "up"
                ? "bg-ui-success-50 text-ui-success-600"
                : "bg-ui-error-50 text-ui-error-600",
            )}
          >
            {deltaTrend === "up" ? ArrowUp : ArrowDown}
            {delta}
          </span>
        ) : null}
      </div>
    </div>
  ),
);
StatCard.displayName = "StatCard";
