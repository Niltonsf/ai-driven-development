import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";

const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-ui-gray-100 text-ui-gray-700",
  {
    variants: {
      size: {
        xs: "h-6 w-6 text-xs",
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-14 w-14 text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface AvatarProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
  status?: "online" | "offline" | "busy" | null;
}

const statusColor = {
  online: "bg-ui-success-500",
  offline: "bg-ui-gray-400",
  busy: "bg-ui-error-500",
} as const;

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  (
    { className, size, src, alt, fallback, status = null, ...props },
    ref,
  ) => (
    <span
      ref={ref}
      className={cn(avatarVariants({ size }), className)}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt ?? ""}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="font-medium">{fallback ?? ""}</span>
      )}
      {status ? (
        <span
          className={cn(
            "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white",
            statusColor[status],
          )}
        />
      ) : null}
    </span>
  ),
);
Avatar.displayName = "Avatar";
