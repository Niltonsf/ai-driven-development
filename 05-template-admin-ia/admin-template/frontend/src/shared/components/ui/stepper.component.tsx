import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";

export interface Step {
  label: string;
  description?: string;
}

export interface StepperProps extends HTMLAttributes<HTMLOListElement> {
  steps: Step[];
  currentStep: number;
  orientation?: "horizontal" | "vertical";
}

const Check = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M11.6668 3.5L5.25016 9.91667L2.3335 7"
      stroke="currentColor"
      strokeWidth="1.94437"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Stepper = forwardRef<HTMLOListElement, StepperProps>(
  ({ steps, currentStep, orientation = "horizontal", className, ...props }, ref) => {
    const isHorizontal = orientation === "horizontal";
    return (
      <ol
        ref={ref}
        className={cn(
          isHorizontal
            ? "flex w-full items-start"
            : "flex flex-col gap-4",
          className,
        )}
        aria-label="Progress"
        {...props}
      >
        {steps.map((step, idx) => {
          const status =
            idx < currentStep ? "complete" : idx === currentStep ? "active" : "pending";
          const isLast = idx === steps.length - 1;
          return (
            <li
              key={step.label}
              className={cn(
                isHorizontal
                  ? "flex flex-1 items-start"
                  : "flex items-start gap-3",
              )}
            >
              <div
                className={cn(
                  "flex flex-col items-center",
                  isHorizontal ? "" : "items-start",
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                      status === "complete"
                        ? "bg-ui-stepper-stepCompleteBg text-ui-stepper-stepActiveFg"
                        : status === "active"
                          ? "bg-ui-stepper-stepActiveBg text-ui-stepper-stepActiveFg"
                          : "bg-ui-stepper-stepBg text-ui-stepper-stepFg",
                    )}
                    aria-current={status === "active" ? "step" : undefined}
                  >
                    {status === "complete" ? Check : idx + 1}
                  </span>
                  <div className={cn(isHorizontal ? "hidden md:block" : "")}>
                    <div
                      className={cn(
                        "text-sm font-medium",
                        status === "pending" ? "text-ui-gray-500" : "text-ui-gray-800",
                      )}
                    >
                      {step.label}
                    </div>
                    {step.description ? (
                      <div className="text-xs text-ui-gray-500">{step.description}</div>
                    ) : null}
                  </div>
                </div>
              </div>
              {!isLast ? (
                <div
                  className={cn(
                    isHorizontal
                      ? "mx-3 mt-4 h-px flex-1"
                      : "ml-4 mt-2 h-6 w-px",
                    status === "complete"
                      ? "bg-ui-stepper-connectorComplete"
                      : "bg-ui-stepper-connector",
                  )}
                  aria-hidden="true"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    );
  },
);
Stepper.displayName = "Stepper";
