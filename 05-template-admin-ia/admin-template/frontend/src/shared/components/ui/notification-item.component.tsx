import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Avatar } from "./avatar.component";

export interface NotificationItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  avatarSrc?: string;
  avatarAlt?: string;
  title: ReactNode;
  description?: ReactNode;
  timestamp?: string;
  unread?: boolean;
}

export const NotificationItem = forwardRef<HTMLDivElement, NotificationItemProps>(
  (
    {
      avatarSrc,
      avatarAlt,
      title,
      description,
      timestamp,
      unread,
      className,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        "flex items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-ui-notificationItem-hoverBg",
        className,
      )}
      {...props}
    >
      {avatarSrc ? (
        <div className="relative shrink-0">
          <Avatar src={avatarSrc} alt={avatarAlt ?? ""} size="md" />
          {unread ? (
            <span
              className="absolute right-0 top-0 block h-2.5 w-2.5 rounded-full border-2 border-white bg-ui-notificationItem-unreadDot"
              aria-hidden="true"
            />
          ) : null}
        </div>
      ) : null}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ui-gray-700">{title}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-ui-gray-500">{description}</p>
        ) : null}
        {timestamp ? (
          <p className="mt-1 text-xs text-ui-gray-400">{timestamp}</p>
        ) : null}
      </div>
    </div>
  ),
);
NotificationItem.displayName = "NotificationItem";
