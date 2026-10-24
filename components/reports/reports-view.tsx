"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoNotice } from "@/components/ui/demo-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { Feedback } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { downloadCsv } from "@/lib/csv";
import { buildReport, filterReportRows, type ReportKind } from "@/lib/reports";
import { useAdminState } from "@/lib/store";
import { RISK_OPTIONS, semesterOptions } from "@/lib/utils";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";

const REPORTS: Array<{ id: ReportKind; label: string }> = [
  { id: "performance", label: "Student performance" },
  { id: "high-risk", label: "High-risk students" },
  { id: "departments", label: "Department summary" },
  { id: "attendance", label: "Attendance" },
  { id: "courses", label: "Course performance" },
];

export function ReportsView() {
  const state = useAdminState();
  const [kind, setKind] = useState<ReportKind>("performance");
  const [departmentId, setDepartmentId] = useState("all");
  const [semester, setSemester] = useState("all");
  const [risk, setRisk] = useState("all");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  const report = useMemo(
    () => buildReport(state, kind, { departmentId, semester, risk, query: "" }),
    [state, kind, departmentId, semester, risk],
  );
  const rows = filterReportRows(report.rows, query);

  function exportCsv() {
    if (rows.length === 0) {
      setMessage("Nothing to export for these filters.");
      return;
    }
    const saved = downloadCsv(report.filename, [report.columns, ...rows]);
    setMessage(
      saved
        ? `Downloaded ${report.filename}. The file contains demonstration data only.`
        : "The export could not be started.",
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reports"
        description="Preview a demonstration report and download the same rows as CSV."
        actions={
          <Button onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Export CSV
          </Button>
        }
      />
      <DemoNotice>Reports use the fictional session data. Export downloads a CSV file in the browser and does not contact a server.</DemoNotice>
      <Feedback message={message} />
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Select id="report-kind" label="Report" value={kind} onChange={(event) => setKind(event.target.value as ReportKind)} options={REPORTS.map((item) => ({ label: item.label, value: item.id }))} />
          <Select id="report-department" label="Department" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} options={[{ label: "All departments", value: "all" }, ...state.departments.map((item) => ({ label: item.code, value: item.id }))]} />
          <Select id="report-semester" label="Semester" value={semester} onChange={(event) => setSemester(event.target.value)} options={semesterOptions(true)} />
          {kind === "performance" ? (
            <Select id="report-risk" label="Risk" value={risk} onChange={(event) => setRisk(event.target.value)} options={RISK_OPTIONS} />
          ) : (
            <Input id="report-search" label="Search preview" placeholder="Filter the preview" value={query} onChange={(event) => setQuery(event.target.value)} />
          )}
        </div>
        {kind === "performance" ? (
          <div className="mt-3 max-w-sm">
            <Input id="report-search-performance" label="Search preview" placeholder="Filter the preview" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        ) : null}
      </Card>
      <Card>
        <div className="border-b border-slate-100 px-4 py-4 xs:px-5">
          <h2 className="text-sm font-semibold text-slate-900">{report.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{report.description}</p>
        </div>
        {rows.length === 0 ? (
          <EmptyState title="No rows for this report" description="Adjust the filters. The export stays disabled until the preview has rows." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">{report.title}</caption>
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  {report.columns.map((column) => (
                    <th key={column} className="whitespace-nowrap px-4 py-3 font-medium first:pl-5">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, index) => (
                  <tr key={`${row[0]}-${row[1]}-${index}`}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${columnKey(report.columns, cellIndex)}-${index}`} className="max-w-xs whitespace-normal px-4 py-3 text-slate-700 first:pl-5">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function columnKey(columns: string[], index: number): string {
  return columns[index] ?? String(index);
}
