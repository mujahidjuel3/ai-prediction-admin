"use client";

import type { ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

export function ChartFrame({ children }: { children: ReactNode }) {
  return (
    <div className="h-64 w-full min-w-0 sm:h-72">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
