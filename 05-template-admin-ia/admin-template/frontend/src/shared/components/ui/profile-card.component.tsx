import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Avatar } from "./avatar.component";

export interface ProfileCardProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  role?: string;
  avatarSrc?: string;
  avatarAlt?: string;
  badge?: ReactNode;
  actions?: ReactNode;
}

export const ProfileCard = forwardRef<HTMLDivElement, ProfileCardProps>(
  ({ name, role, avatarSrc, avatarAlt, badge, actions, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-ui-card-border bg-ui-card-bg p-5 lg:p-6",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
        <Avatar src={avatarSrc} alt={avatarAlt ?? name} size="lg" />
        <div className="flex-1">
          <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
            <h4 className="text-base font-semibold text-ui-gray-800">{name}</h4>
            {badge}
          </div>
          {role ? (
            <p className="mt-0.5 text-sm text-ui-gray-500">{role}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  ),
);
ProfileCard.displayName = "ProfileCard";
