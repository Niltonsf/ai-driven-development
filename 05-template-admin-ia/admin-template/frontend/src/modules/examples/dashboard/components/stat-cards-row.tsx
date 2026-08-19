/**
 * Stat cards row — replica os "Metric Group One" do dashboard eCommerce do template.
 */
import { StatCard } from "@/shared/components/ui";
import { stats } from "../mock-data";

const UsersIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.8 5.6a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4Zm-3.7 2.2a3.7 3.7 0 1 1 7.4 0 3.7 3.7 0 0 1-7.4 0Zm-1.3 7.5c1-1 2.6-1.7 4.9-1.7s3.9.7 4.9 1.7c1 1 1.5 2.3 1.7 3.3.3 1.4-.8 2.4-2 2.4H4.1c-1.2 0-2.4-1-2.1-2.4.2-1 .7-2.3 1.7-3.3Z"
      fill="currentColor"
    />
  </svg>
);

const BoxIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.7 2.2c.2 0 .5.1.7.2l7.6 4.3c.5.3.7.9.5 1.4-.2.5-.8.7-1.3.4l-7.5-4.3-7.5 4.3c-.5.3-1.1.1-1.3-.4s0-1.1.4-1.4L10.9 2.4c.3-.1.5-.2.8-.2Zm0 4.4c.3 0 .6.1.9.2l5.7 3.3c.6.3.9 1 .9 1.6v6c0 .7-.4 1.3-.9 1.6l-5.7 3.3a1.8 1.8 0 0 1-1.8 0l-5.7-3.3a1.9 1.9 0 0 1-.9-1.6v-6c0-.7.4-1.3.9-1.6l5.7-3.3c.3-.1.6-.2.9-.2Z"
      fill="currentColor"
    />
  </svg>
);

export function StatCardsRow() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      <StatCard
        icon={UsersIcon}
        label={stats[0].label}
        value={stats[0].value}
        delta={stats[0].delta}
        deltaTrend={stats[0].trend}
      />
      <StatCard
        icon={BoxIcon}
        label={stats[1].label}
        value={stats[1].value}
        delta={stats[1].delta}
        deltaTrend={stats[1].trend}
      />
    </div>
  );
}
