"use client";

import dynamic from "next/dynamic";
import { ChartLoading } from "./chart-loading.component";
import type { DonutChartProps } from "./donut-chart.impl";

const DonutChartImpl = dynamic(() => import("./donut-chart.impl"), {
  ssr: false,
  loading: () => <ChartLoading height={320} variant="donut" />,
});

export type { DonutChartProps } from "./donut-chart.impl";

export function DonutChart(props: DonutChartProps) {
  return <DonutChartImpl {...props} />;
}
