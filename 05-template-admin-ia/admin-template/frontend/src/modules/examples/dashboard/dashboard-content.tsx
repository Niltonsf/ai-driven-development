/**
 * Dashboard (eCommerce variant)
 *
 * Replica: sites/demo.tailadmin.com/index.html
 * Fidelidade: ALTA
 * Adaptações:
 *   - Mapa de "Customers Demographic" substituído por lista de países com Progress
 *     (composite de mapa não disponível na app).
 *   - Títulos preservados em inglês para fidelidade ao template.
 */
import { PageHeader } from "@/shared/components/ui";
import { StatCardsRow } from "./components/stat-cards-row";
import { MonthlySalesChart } from "./components/monthly-sales-chart";
import { MonthlyTargetCard } from "./components/monthly-target-card";
import { StatisticsChart } from "./components/statistics-chart";
import { CustomersDemographicCard } from "./components/customers-demographic-card";
import { RecentOrdersTable } from "./components/recent-orders-table";

export function DashboardContent() {
  return (
    <>
      <PageHeader title="eCommerce" subtitle="Visão geral do desempenho da loja" />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <StatCardsRow />
          <MonthlySalesChart />
        </div>
        <div className="col-span-12 xl:col-span-5">
          <MonthlyTargetCard />
        </div>

        <div className="col-span-12">
          <StatisticsChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <CustomersDemographicCard />
        </div>
        <div className="col-span-12 xl:col-span-7">
          <RecentOrdersTable />
        </div>
      </div>
    </>
  );
}
