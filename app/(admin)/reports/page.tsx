import { ReportsView } from "@/components/reports/reports-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return <ReportsView />;
}
