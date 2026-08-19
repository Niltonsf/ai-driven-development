import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";

const pricingCardVariants = cva(
  "rounded-2xl border p-6 flex flex-col",
  {
    variants: {
      variant: {
        default: "bg-ui-pricingCard-bg border-ui-pricingCard-border",
        featured:
          "bg-ui-pricingCard-featuredBg border-ui-pricingCard-featuredBorder text-ui-pricingCard-featuredFg",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface PricingCardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pricingCardVariants> {
  planName: string;
  price: string;
  /** e.g. "/month". */
  period?: string;
  /** Striked-through original price. */
  strikePrice?: string;
  description?: string;
  features: ReactNode[];
  cta?: ReactNode;
}

const Check = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M3.333 8.333l3 3 6.334-6.333"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PricingCard = forwardRef<HTMLDivElement, PricingCardProps>(
  (
    {
      planName,
      price,
      period,
      strikePrice,
      description,
      features,
      cta,
      variant,
      className,
      ...props
    },
    ref,
  ) => {
    const isFeatured = variant === "featured";
    return (
      <div
        ref={ref}
        className={cn(pricingCardVariants({ variant }), className)}
        {...props}
      >
        <span
          className={cn(
            "mb-3 block text-xl font-semibold",
            isFeatured ? "text-ui-pricingCard-featuredFg" : "text-ui-gray-800",
          )}
        >
          {planName}
        </span>
        <div className="mb-4 flex items-end gap-2">
          <span
            className={cn(
              "text-3xl font-bold",
              isFeatured ? "text-ui-pricingCard-featuredFg" : "text-ui-gray-800",
            )}
          >
            {price}
          </span>
          {period ? (
            <span
              className={cn(
                "mb-1 inline-block text-sm",
                isFeatured ? "text-ui-pricingCard-featuredFgMuted" : "text-ui-gray-500",
              )}
            >
              {period}
            </span>
          ) : null}
          {strikePrice ? (
            <span className="mb-1 inline-block text-xl font-semibold text-ui-pricingCard-priceStrike line-through">
              {strikePrice}
            </span>
          ) : null}
        </div>
        {description ? (
          <p
            className={cn(
              "mb-5 text-sm",
              isFeatured ? "text-ui-pricingCard-featuredFgMuted" : "text-ui-gray-500",
            )}
          >
            {description}
          </p>
        ) : null}
        <ul className="mb-6 flex flex-col gap-3">
          {features.map((feat, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <span
                className={cn(
                  "mt-0.5",
                  isFeatured ? "text-ui-pricingCard-featuredFg" : "text-ui-success-500",
                )}
              >
                {Check}
              </span>
              <span
                className={
                  isFeatured ? "text-ui-pricingCard-featuredFg" : "text-ui-gray-700"
                }
              >
                {feat}
              </span>
            </li>
          ))}
        </ul>
        {cta ? <div className="mt-auto">{cta}</div> : null}
      </div>
    );
  },
);
PricingCard.displayName = "PricingCard";
