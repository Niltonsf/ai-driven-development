"use client";

import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { cn } from "@/shared/utils/cn";
import { chartTheme } from "./_chart-theme";

export type RadialBarChartProps = {
  /** Single value 0–100, or an array of values for multi-track radial. */
  value: number | number[];
  labels?: string[];
  colors?: string[];
  height?: number;
  hollowSize?: string;
  showTrack?: boolean;
  className?: string;
  ariaLabel?: string;
};

export default function RadialBarChartImpl({
  value,
  labels,
  colors,
  height = 320,
  hollowSize = "70%",
  showTrack = true,
  className,
  ariaLabel = "Radial bar chart",
}: RadialBarChartProps) {
  const series = Array.isArray(value) ? value : [value];
  const palette = colors ?? [...chartTheme.series];
  const options: ApexOptions = {
    chart: {
      type: "radialBar",
      fontFamily: chartTheme.typography.fontFamily,
      animations: {
        enabled: true,
        speed: chartTheme.animation.duration,
      },
      toolbar: { show: false },
    },
    colors: palette,
    labels: labels ?? series.map((_, i) => `Series ${i + 1}`),
    plotOptions: {
      radialBar: {
        hollow: { size: hollowSize },
        track: showTrack
          ? { background: chartTheme.grid, strokeWidth: "100%" }
          : { show: false },
        dataLabels: {
          name: {
            fontFamily: chartTheme.typography.fontFamily,
            color: chartTheme.tickLabel,
            fontSize: `${chartTheme.typography.legendSize}px`,
          },
          value: {
            fontFamily: chartTheme.typography.fontFamily,
            color: chartTheme.axisLabel,
            fontSize: "20px",
            fontWeight: 600,
          },
        },
      },
    },
    stroke: { lineCap: "round" },
  };
  return (
    <div className={cn("w-full", className)} role="img" aria-label={ariaLabel}>
      <Chart options={options} series={series} type="radialBar" height={height} />
    </div>
  );
}
