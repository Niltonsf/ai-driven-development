/**
 * Analytics dashboard
 * Replica: sites/demo.tailadmin.com/analytics.html
 * Fidelidade: MÉDIA — composição com mesma família de blocos (KPIs + gráficos + tabela).
 */
import { PageHeader, StatCard, Card } from "@/shared/components/ui";
import { ChartContainer, AreaChart, BarChart, DonutChart } from "@/shared/components/charts";

export function AnalyticsContent() {
  return (
    <>
      <PageHeader
        title="Analytics"
        breadcrumbs={[{ label: "Início", href: "/dashboard" }, { label: "Analytics" }]}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <StatCard label="Sessions" value="12,488" delta="3.2%" deltaTrend="up" />
        <StatCard label="Bounce rate" value="42.7%" delta="0.8%" deltaTrend="down" />
        <StatCard label="Avg. duration" value="04:12" delta="1.4%" deltaTrend="up" />
        <StatCard label="Conversion" value="3.18%" delta="0.6%" deltaTrend="up" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-6">
        <div className="lg:col-span-2">
          <ChartContainer title="Sessions over time">
            <AreaChart
              height={320}
              categories={["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]}
              series={[{ name: "Sessions", data: [320, 410, 380, 510, 470, 540, 600, 580, 640, 700, 720, 810] }]}
            />
          </ChartContainer>
        </div>
        <ChartContainer title="Traffic sources">
          <DonutChart
            labels={["Direct", "Search", "Social", "Referral"]}
            values={[44, 30, 18, 8]}
            height={320}
            showTotal
            totalLabel="Visits"
          />
        </ChartContainer>
      </div>

      <div className="mt-6">
        <ChartContainer title="Page views per category">
          <BarChart
            height={320}
            categories={["Home", "Blog", "Pricing", "Docs", "Contact", "Other"]}
            series={[{ name: "Views", data: [4200, 2800, 1700, 3500, 900, 1200] }]}
          />
        </ChartContainer>
      </div>

      <Card className="mt-6">
        <Card.Header>
          <Card.Title>Top pages</Card.Title>
        </Card.Header>
        <Card.Body>
          <ul className="divide-y divide-ui-card-border">
            {[
              { path: "/", views: 4218 },
              { path: "/blog", views: 2841 },
              { path: "/pricing", views: 1705 },
              { path: "/docs", views: 3520 },
              { path: "/contact", views: 902 },
            ].map((p) => (
              <li key={p.path} className="flex items-center justify-between py-3 text-sm">
                <span className="font-mono text-ui-gray-700">{p.path}</span>
                <span className="text-ui-gray-500">{p.views.toLocaleString("pt-BR")} views</span>
              </li>
            ))}
          </ul>
        </Card.Body>
      </Card>
    </>
  );
}
