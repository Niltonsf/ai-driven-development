/**
 * Statistics chart — area chart com sales + revenue (replica bloco "Statistics").
 */
import { ChartContainer, AreaChart } from "@/shared/components/charts";
import {
  statisticsCategories,
  statisticsSales,
  statisticsRevenue,
} from "../mock-data";

export function StatisticsChart() {
  return (
    <ChartContainer
      title="Statistics"
      description="Target you’ve set for each month"
    >
      <AreaChart
        height={310}
        categories={statisticsCategories}
        series={[
          { name: "Sales", data: statisticsSales },
          { name: "Revenue", data: statisticsRevenue },
        ]}
      />
    </ChartContainer>
  );
}
