"use client";

import { ChartFrame } from "@/components/charts/chart-frame";
import { CHART_TOOLTIP_STYLE } from "@/lib/constants";
import { riskLabel } from "@/lib/utils";
import type { RiskDistributionPoint } from "@/types/analytics";
import { Cell, Legend, Pie, PieChart, Tooltip } from "recharts";

const COLORS: Record<string, string> = {
  low: "#16A34A",
  medium: "#D97706",
  high: "#DC2626",
};

export function RiskDistributionChart({ data }: { data: RiskDistributionPoint[] }) {
  const chartData = data.map((item) => ({ ...item, name: riskLabel(item.level) }));
  const total = chartData.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) {
    return <p className="py-16 text-center text-sm text-slate-500">No students in this view.</p>;
  }

  return (
    <ChartFrame>
      <PieChart>
        <Pie data={chartData} dataKey="count" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2} stroke="#fff" isAnimationActive={false}>
          {chartData.map((entry) => (
            <Cell key={entry.level} fill={COLORS[entry.level]} />
          ))}
        </Pie>
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
        <Legend />
      </PieChart>
    </ChartFrame>
  );
}
