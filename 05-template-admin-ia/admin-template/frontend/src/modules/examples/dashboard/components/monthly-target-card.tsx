/**
 * Monthly Target — radial bar (replica bloco "Monthly Target" do template).
 */
import { Card, Badge } from "@/shared/components/ui";
import { RadialBarChart } from "@/shared/components/charts";
import { monthlyTargetPercent } from "../mock-data";

export function MonthlyTargetCard() {
  return (
    <Card>
      <Card.Body>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-ui-gray-800">Monthly Target</h3>
            <p className="mt-1 text-sm text-ui-gray-500">Target you’ve set for each month</p>
          </div>
        </div>
        <RadialBarChart
          value={monthlyTargetPercent}
          labels={["Progress"]}
          height={290}
        />
        <p className="text-center text-sm text-ui-gray-500">
          You earn $3287 today, it&apos;s higher than last month. Keep up your good work!
        </p>
        <div className="mt-5 grid grid-cols-3 divide-x divide-ui-card-border text-center">
          <div className="px-3">
            <span className="block text-xs text-ui-gray-500">Target</span>
            <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-ui-gray-800">
              $20K
              <Badge variant="error" size="sm">↓</Badge>
            </span>
          </div>
          <div className="px-3">
            <span className="block text-xs text-ui-gray-500">Revenue</span>
            <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-ui-gray-800">
              $20K
              <Badge variant="success" size="sm">↑</Badge>
            </span>
          </div>
          <div className="px-3">
            <span className="block text-xs text-ui-gray-500">Today</span>
            <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-ui-gray-800">
              $20K
              <Badge variant="success" size="sm">↑</Badge>
            </span>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
