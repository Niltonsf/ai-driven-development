"use client";

import dynamic from "next/dynamic";
import { ChartLoading } from "./chart-loading.component";
import type { LineChartProps } from "./line-chart.impl";

const LineChartImpl = dynamic(() => import("./line-chart.impl"), {
  ssr: false,
  loading: () => <ChartLoading height={300} variant="line" />,
});

export type { LineChartProps, LineVariant } from "./line-chart.impl";

export function LineChart(props: LineChartProps) {
  return <LineChartImpl {...props} />;
}
