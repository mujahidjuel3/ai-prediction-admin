import { AlertsView } from "@/components/alerts/alerts-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Early Warning Alerts" };

export default function AlertsPage() {
  return <AlertsView />;
}
