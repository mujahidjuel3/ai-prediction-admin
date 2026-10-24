"use client";

import { ChartFrame } from "@/components/charts/chart-frame";
import { CHART_GRID, CHART_TICK, CHART_TOOLTIP_STYLE } from "@/lib/constants";
import type { BucketPoint } from "@/types/analytics";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

export function BucketChart({ data, label }: { data: BucketPoint[]; label: string }) {
  return (
    <ChartFrame>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
        <XAxis dataKey="range" tick={CHART_TICK} interval={0} />
        <YAxis tick={CHART_TICK} allowDecimals={false} width={32} />
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
        <Bar dataKey="count" name={label} fill="#2563EB" radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ChartFrame>
  );
}
