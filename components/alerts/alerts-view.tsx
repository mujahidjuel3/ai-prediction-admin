"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DemoNotice } from "@/components/ui/demo-notice";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Feedback } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { SeverityBadge, StatusBadge } from "@/components/ui/status-badges";
import { usePagination } from "@/hooks/use-pagination";
import { alertRows, alertSummary, type AlertRow } from "@/lib/selectors";
import { resolveAlert, useAdminState } from "@/lib/store";
import { alertCategoryLabel, formatDate, includesQuery } from "@/lib/utils";
import { AlertTriangle, Bell, CheckCheck, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

interface AlertsViewProps {
  initialSeverity?: string;
  initialStatus?: string;
}

export function AlertsView({ initialSeverity = "all", initialStatus = "all" }: AlertsViewProps) {
  const state = useAdminState();
  const summary = alertSummary(state);
  const rows = alertRows(state);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState(initialSeverity);
  const [status, setStatus] = useState(initialStatus);
  const [selected, setSelected] = useState<AlertRow | null>(null);
  const [pending, setPending] = useState<AlertRow | null>(null);
  const [message, setMessage] = useState("");

  const filtered = useMemo(
    () =>
      [...rows]
        .filter((alert) => {
          const matchesQuery = includesQuery(query, [alert.studentName, alert.publicStudentId, alert.reason]);
          const matchesSeverity = severity === "all" || alert.severity === severity;
          const matchesStatus = status === "all" || alert.status === status;
          return matchesQuery && matchesSeverity && matchesStatus;
        })
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [rows, query, severity, status],
  );
  const pagination = usePagination(filtered, state.settings.system.pageSize);

  function confirmResolve() {
    if (!pending) return;
    const result = resolveAlert(pending.id);
    setMessage(result.ok ? "Alert marked resolved in this demonstration session. No email was sent." : result.message);
    setPending(null);
    setSelected(null);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Early warning alerts"
        description="Review sample alerts and mark them resolved in this session. Nothing is emailed or pushed."
      />
      <DemoNotice>Resolving an alert updates its status locally. It does not notify a student or teacher.</DemoNotice>
      <Feedback message={message} />
      <section className="grid grid-cols-1 gap-4 xs:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total alerts" value={summary.total} icon={Bell} />
        <StatCard label="High priority" value={summary.high} icon={ShieldAlert} tone="danger" />
        <StatCard label="Medium priority" value={summary.medium} icon={AlertTriangle} tone="warning" />
        <StatCard label="Resolved" value={summary.resolved} icon={CheckCheck} tone="success" />
      </section>
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input id="alert-search" label="Search" placeholder="Student or reason" value={query} onChange={(event) => { setQuery(event.target.value); pagination.setPage(1); }} />
          <Select id="alert-severity" label="Severity" value={severity} onChange={(event) => { setSeverity(event.target.value); pagination.setPage(1); }} options={[{ label: "All severities", value: "all" }, { label: "High", value: "high" }, { label: "Medium", value: "medium" }, { label: "Low", value: "low" }]} />
          <Select id="alert-status" label="Status" value={status} onChange={(event) => { setStatus(event.target.value); pagination.setPage(1); }} options={[{ label: "All statuses", value: "all" }, { label: "Open", value: "open" }, { label: "Acknowledged", value: "acknowledged" }, { label: "Resolved", value: "resolved" }]} />
        </div>
      </Card>
      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No alerts match" description="Adjust the search, severity, or status filters." />
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {pagination.pagedItems.map((alert) => (
                <li key={alert.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityBadge level={alert.severity} />
                      <StatusBadge status={alert.status} />
                      <span className="text-xs text-slate-500">{alertCategoryLabel(alert.category)}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-900">{alert.studentName}</p>
                    <p className="text-xs text-slate-500">{alert.publicStudentId} · {formatDate(alert.createdAt)}</p>
                    <p className="mt-2 text-sm text-slate-600">{alert.reason}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelected(alert)}>Details</Button>
                    {alert.status !== "resolved" ? (
                      <Button size="sm" onClick={() => setPending(alert)}>Mark resolved</Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            <Pagination {...pagination} onPageChange={pagination.setPage} />
          </>
        )}
      </Card>
      <Dialog open={selected !== null} title="Alert details" onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <SeverityBadge level={selected.severity} />
              <StatusBadge status={selected.status} />
            </div>
            <p className="font-medium text-slate-900">{selected.studentName}</p>
            <p className="text-slate-500">{selected.publicStudentId} · {selected.departmentName}</p>
            <p><span className="text-slate-500">Category: </span>{alertCategoryLabel(selected.category)}</p>
            <p><span className="text-slate-500">Created: </span>{formatDate(selected.createdAt)}</p>
            <p className="text-slate-700">{selected.reason}</p>
            <Card>
              <CardHeader><CardTitle>Recommended action</CardTitle></CardHeader>
              <CardContent><p>{selected.recommendedAction}</p></CardContent>
            </Card>
            <div className="flex flex-col gap-2 sm:flex-row">
              {selected.studentMissing ? null : (
                <Link href={`/students/${selected.studentId}`} className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  View student
                </Link>
              )}
              {selected.status !== "resolved" ? (
                <Button onClick={() => setPending(selected)}>Mark resolved</Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Dialog>
      <ConfirmDialog
        open={pending !== null}
        title="Mark alert resolved"
        description="This changes the alert status in the current demonstration session. It does not send an email or a real-time event."
        confirmLabel="Mark resolved"
        tone="primary"
        onClose={() => setPending(null)}
        onConfirm={confirmResolve}
      />
    </div>
  );
}
