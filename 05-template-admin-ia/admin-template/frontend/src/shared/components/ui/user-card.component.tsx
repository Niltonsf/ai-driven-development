import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Avatar } from "./avatar.component";

export interface UserCardProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  description?: string;
  avatarSrc?: string;
  trailing?: ReactNode;
}

export const UserCard = forwardRef<HTMLDivElement, UserCardProps>(
  ({ name, description, avatarSrc, trailing, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-ui-gray-50",
        className,
      )}
      {...props}
    >
      <Avatar src={avatarSrc} alt={name} size="md" />
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-medium text-ui-gray-800">{name}</div>
        {description ? (
          <div className="truncate text-xs text-ui-gray-500">{description}</div>
        ) : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  ),
);
UserCard.displayName = "UserCard";
