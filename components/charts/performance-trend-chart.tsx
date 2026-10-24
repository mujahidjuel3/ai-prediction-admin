"use client";

import { ChartFrame } from "@/components/charts/chart-frame";
import { CHART_GRID, CHART_TICK, CHART_TOOLTIP_STYLE } from "@/lib/constants";
import type { MonthlyMetric } from "@/types/common";
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

export function PerformanceTrendChart({ data }: { data: MonthlyMetric[] }) {
  return (
    <ChartFrame>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={CHART_TICK} />
        <YAxis yAxisId="left" tick={CHART_TICK} domain={[0, 4]} width={32} />
        <YAxis yAxisId="right" orientation="right" tick={CHART_TICK} domain={[0, 100]} width={36} />
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
        <Legend />
        <Line yAxisId="left" type="monotone" dataKey="gpa" name="Average GPA" stroke="#2563EB" strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line yAxisId="right" type="monotone" dataKey="attendance" name="Attendance" stroke="#16A34A" strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line yAxisId="right" type="monotone" dataKey="assessment" name="Assessment" stroke="#D97706" strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ChartFrame>
  );
}
