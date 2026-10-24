"use client";

import { RiskDistributionChart } from "@/components/charts/risk-distribution-chart";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoNotice } from "@/components/ui/demo-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { FactorBadge, RiskBadge } from "@/components/ui/status-badges";
import { StatCard } from "@/components/ui/stat-card";
import { usePagination } from "@/hooks/use-pagination";
import { countRisk, riskDistribution } from "@/lib/academics";
import type { ModelPlaceholder } from "@/types/prediction";
import { predictionRows } from "@/lib/selectors";
import { useAdminState } from "@/lib/store";
import { formatConfidence, formatDate } from "@/lib/utils";
import { AlertTriangle, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";

const PLACEHOLDERS: ModelPlaceholder[] = [
  { label: "Accuracy", value: "Not available", note: "No held-out evaluation has been run." },
  { label: "Precision", value: "Not available", note: "Requires a connected model service." },
  { label: "Recall", value: "Not available", note: "Requires a connected model service." },
  { label: "Last trained", value: "Not trained", note: "This screen does not train or call a model." },
];

export function PredictionsView() {
  const state = useAdminState();
  const rows = [...predictionRows(state)].sort((left, right) => right.date.localeCompare(left.date));
  const counts = countRisk(rows);
  const pagination = usePagination(rows, state.settings.system.pageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI predictions"
        description="Administration view of sample risk rows. These are not responses from a trained model."
      />
      <DemoNotice>
        Confidence is shown only when the sample row defines it. New students added in this session keep confidence as not available.
      </DemoNotice>
      <section className="grid grid-cols-1 gap-4 xs:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total predictions" value={rows.length} icon={Sparkles} />
        <StatCard label="High risk" value={counts.high} icon={AlertTriangle} tone="danger" href="/students?risk=high" />
        <StatCard label="Medium risk" value={counts.medium} icon={UserRound} tone="warning" href="/students?risk=medium" />
        <StatCard label="Low risk" value={counts.low} icon={ShieldCheck} tone="success" href="/students?risk=low" />
      </section>
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Risk distribution</CardTitle>
            <CardDescription>Counts from the sample prediction rows in this session.</CardDescription>
          </CardHeader>
          <CardContent>
            <RiskDistributionChart data={riskDistribution(rows)} />
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Model metrics</CardTitle>
            <CardDescription>Demonstration placeholders. These are not evaluation results.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PLACEHOLDERS.map((item) => (
              <div key={item.label} className="rounded-md border border-slate-200 p-3">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
                <p className="mt-1 text-xs text-slate-500">{item.note}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Recent prediction rows</CardTitle>
          <CardDescription>Sorted by the sample prediction date.</CardDescription>
        </CardHeader>
        {rows.length === 0 ? (
          <EmptyState title="No predictions" description="Prediction rows appear when students are in the session." />
        ) : (
          <>
            <div className="hidden lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      {["Student", "ID", "Department", "Risk", "Confidence", "Factors", "Date", ""].map((heading) => (
                        <th key={heading || "action"} className="px-4 py-3 font-medium first:pl-5">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagination.pagedItems.map((row) => (
                      <tr key={row.studentId}>
                        <td className="px-5 py-3 font-medium text-slate-900">{row.studentName}</td>
                        <td className="px-4 py-3">{row.publicStudentId}</td>
                        <td className="px-4 py-3">{row.departmentName}</td>
                        <td className="px-4 py-3"><RiskBadge level={row.riskLevel} /></td>
                        <td className="px-4 py-3">{formatConfidence(row.confidence)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {row.factors.map((factor) => (
                              <FactorBadge key={factor.name} level={factor.level} />
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">{formatDate(row.date)}</td>
                        <td className="px-4 py-3">
                          <Link href={`/students/${row.studentId}`} className={buttonClassName("outline", "sm")}>Student</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="space-y-3 p-4 lg:hidden">
              {pagination.pagedItems.map((row) => (
                <article key={row.studentId} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{row.studentName}</p>
                      <p className="text-xs text-slate-500">{row.publicStudentId}</p>
                    </div>
                    <RiskBadge level={row.riskLevel} />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{row.summary}</p>
                  <p className="mt-2 text-xs text-slate-500">Confidence {formatConfidence(row.confidence)} · {formatDate(row.date)}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {row.factors.map((factor) => (
                      <FactorBadge key={factor.name} level={factor.level} />
                    ))}
                  </div>
                  <Link href={`/students/${row.studentId}`} className={`${buttonClassName("outline", "sm")} mt-3 w-full`}>View student</Link>
                </article>
              ))}
            </div>
            <Pagination {...pagination} onPageChange={pagination.setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
