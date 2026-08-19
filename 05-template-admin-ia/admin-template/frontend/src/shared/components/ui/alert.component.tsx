import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";

const alertVariants = cva(
  "flex w-full items-start gap-3 rounded-xl border p-4",
  {
    variants: {
      variant: {
        info: "border-ui-brand-200 bg-ui-brand-50 text-ui-brand-800",
        success:
          "border-ui-success-300 bg-ui-success-50 text-ui-success-700",
        warning:
          "border-ui-warning-400 bg-ui-warning-50 text-ui-warning-700",
        error: "border-ui-error-300 bg-ui-error-50 text-ui-error-700",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

const iconMap = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
} as const;

export interface AlertProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof alertVariants> {
  title?: ReactNode;
  icon?: ReactNode;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "info", title, icon, children, ...props }, ref) => {
    const Icon = iconMap[variant ?? "info"];
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <span className="mt-0.5 shrink-0">
          {icon ?? <Icon className="h-5 w-5" aria-hidden="true" />}
        </span>
        <div className="flex-1">
          {title ? <p className="text-sm font-semibold">{title}</p> : null}
          {children ? <div className="text-sm">{children}</div> : null}
        </div>
      </div>
    );
  },
);
Alert.displayName = "Alert";
