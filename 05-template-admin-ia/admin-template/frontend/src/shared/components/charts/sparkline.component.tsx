"use client";

import dynamic from "next/dynamic";
import { ChartLoading } from "./chart-loading.component";
import type { SparklineProps } from "./sparkline.impl";

const SparklineImpl = dynamic(() => import("./sparkline.impl"), {
  ssr: false,
  loading: () => <ChartLoading height={50} variant="sparkline" />,
});

export type { SparklineProps, SparklineVariant } from "./sparkline.impl";

export function Sparkline(props: SparklineProps) {
  return <SparklineImpl {...props} />;
}
