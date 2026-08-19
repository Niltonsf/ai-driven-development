"use client";

import dynamic from "next/dynamic";
import { ChartLoading } from "./chart-loading.component";
import type { PieChartProps } from "./pie-chart.impl";

const PieChartImpl = dynamic(() => import("./pie-chart.impl"), {
  ssr: false,
  loading: () => <ChartLoading height={320} variant="pie" />,
});

export type { PieChartProps } from "./pie-chart.impl";

export function PieChart(props: PieChartProps) {
  return <PieChartImpl {...props} />;
}
