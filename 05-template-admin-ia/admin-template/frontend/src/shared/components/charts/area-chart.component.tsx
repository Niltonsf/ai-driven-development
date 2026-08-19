"use client";

import dynamic from "next/dynamic";
import { ChartLoading } from "./chart-loading.component";
import type { AreaChartProps } from "./area-chart.impl";

const AreaChartImpl = dynamic(() => import("./area-chart.impl"), {
  ssr: false,
  loading: () => <ChartLoading height={300} variant="area" />,
});

export type { AreaChartProps } from "./area-chart.impl";

export function AreaChart(props: AreaChartProps) {
  return <AreaChartImpl {...props} />;
}
