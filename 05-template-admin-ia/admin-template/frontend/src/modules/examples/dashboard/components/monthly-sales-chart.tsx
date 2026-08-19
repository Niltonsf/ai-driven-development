/**
 * Monthly Sales — chart de barras (replica bloco "Monthly Sales" do template).
 */
import { ChartContainer, BarChart } from "@/shared/components/charts";
import { monthlySales, monthlySalesCategories } from "../mock-data";

export function MonthlySalesChart() {
  return (
    <ChartContainer title="Monthly Sales">
      <BarChart
        height={180}
        showLegend={false}
        categories={monthlySalesCategories}
        series={[{ name: "Sales", data: monthlySales }]}
      />
    </ChartContainer>
  );
}
