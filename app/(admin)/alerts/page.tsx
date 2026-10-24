import { AlertsView } from "@/components/alerts/alerts-view";
import { readParam } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Early Warning Alerts" };

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const severity = readParam(params.severity);
  const status = readParam(params.status);
  return (
    <AlertsView
      key={`${severity}|${status}`}
      initialSeverity={severity}
      initialStatus={status}
    />
  );
}
