"use client";

import dynamic from "next/dynamic";
import { ChartLoading } from "./chart-loading.component";
import type { RadialBarChartProps } from "./radial-bar-chart.impl";

const RadialBarChartImpl = dynamic(() => import("./radial-bar-chart.impl"), {
  ssr: false,
  loading: () => <ChartLoading height={320} variant="pie" />,
});

export type { RadialBarChartProps } from "./radial-bar-chart.impl";

export function RadialBarChart(props: RadialBarChartProps) {
  return <RadialBarChartImpl {...props} />;
}
