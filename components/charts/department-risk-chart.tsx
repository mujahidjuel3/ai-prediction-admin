"use client";

import { ChartFrame } from "@/components/charts/chart-frame";
import { CHART_GRID, CHART_TICK, CHART_TOOLTIP_STYLE } from "@/lib/constants";
import type { DepartmentRiskPoint } from "@/types/analytics";
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";

export function DepartmentRiskChart({ data }: { data: DepartmentRiskPoint[] }) {
  return (
    <ChartFrame>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
        <XAxis dataKey="code" tick={CHART_TICK} interval={0} />
        <YAxis tick={CHART_TICK} allowDecimals={false} width={32} />
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
        <Legend />
        <Bar dataKey="highRisk" name="High" stackId="risk" fill="#DC2626" isAnimationActive={false} />
        <Bar dataKey="mediumRisk" name="Medium" stackId="risk" fill="#D97706" isAnimationActive={false} />
        <Bar dataKey="lowRisk" name="Low" stackId="risk" fill="#16A34A" isAnimationActive={false} />
      </BarChart>
    </ChartFrame>
  );
}
