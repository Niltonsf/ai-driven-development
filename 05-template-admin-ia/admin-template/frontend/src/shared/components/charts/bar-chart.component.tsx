"use client";

import dynamic from "next/dynamic";
import { ChartLoading } from "./chart-loading.component";
import type { BarChartProps } from "./bar-chart.impl";

const BarChartImpl = dynamic(() => import("./bar-chart.impl"), {
  ssr: false,
  loading: () => <ChartLoading height={300} variant="bar" />,
});

export type { BarChartProps, BarVariant } from "./bar-chart.impl";

export function BarChart(props: BarChartProps) {
  return <BarChartImpl {...props} />;
}
