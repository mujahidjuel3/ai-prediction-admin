"use client";

import { ChartFrame } from "@/components/charts/chart-frame";
import { CHART_GRID, CHART_TICK, CHART_TOOLTIP_STYLE } from "@/lib/constants";
import type { CoursePerformancePoint } from "@/types/analytics";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

export function CourseScoreChart({
  data,
  dataKey,
  label,
}: {
  data: CoursePerformancePoint[];
  dataKey: "averageScore" | "highRiskPercent";
  label: string;
}) {
  const rows = data.filter((item) => item[dataKey] !== null);
  if (rows.length === 0) {
    return <p className="py-16 text-center text-sm text-slate-500">No course records for this filter.</p>;
  }
  return (
    <ChartFrame>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
        <XAxis dataKey="code" tick={CHART_TICK} interval={0} />
        <YAxis tick={CHART_TICK} domain={[0, 100]} width={32} />
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
        <Bar dataKey={dataKey} name={label} fill="#2563EB" radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ChartFrame>
  );
}
