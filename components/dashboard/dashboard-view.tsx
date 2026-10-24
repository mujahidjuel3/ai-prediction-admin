"use client";

import { BucketChart } from "@/components/charts/bucket-chart";
import { DepartmentRiskChart } from "@/components/charts/department-risk-chart";
import { PerformanceTrendChart } from "@/components/charts/performance-trend-chart";
import { RiskDistributionChart } from "@/components/charts/risk-distribution-chart";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PersonIdentity } from "@/components/ui/person-identity";
import { StatCard } from "@/components/ui/stat-card";
import { RiskBadge, SeverityBadge, StatusBadge } from "@/components/ui/status-badges";
import { Badge } from "@/components/ui/badge";
import { dashboardModel } from "@/lib/selectors";
import { useAdminState } from "@/lib/store";
import { alertCategoryLabel, formatDate, formatGpa, formatPercent } from "@/lib/utils";
import { AlertTriangle, Building2, GraduationCap, ShieldCheck, UserRound, Users } from "lucide-react";
import Link from "next/link";

export function DashboardView() {
  const data = dashboardModel(useAdminState());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration overview"
        description="Fictional snapshot of students, staffing, and open alerts. These figures are demonstration data, not a live university extract."
      />

      <section className="grid grid-cols-1 gap-4 xs:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total students" value={data.totalStudents} icon={Users} href="/students" />
        <StatCard label="Total teachers" value={data.totalTeachers} icon={GraduationCap} href="/teachers" />
        <StatCard label="High-risk students" value={data.high} icon={AlertTriangle} tone="danger" href="/students?risk=high" />
        <StatCard label="Medium-risk students" value={data.medium} icon={UserRound} tone="warning" href="/students?risk=medium" />
        <StatCard label="Low-risk students" value={data.low} icon={ShieldCheck} tone="success" href="/students?risk=low" />
        <StatCard label="Departments" value={data.totalDepartments} icon={Building2} href="/departments" />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Student performance trend</CardTitle>
            <CardDescription>
              Illustrative term shape from current GPA, attendance, and assessment indicators. Not a historical extract.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceTrendChart data={data.trend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Risk distribution</CardTitle>
            <CardDescription>Labels follow the demonstration thresholds in Settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <RiskDistributionChart data={data.risk} />
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Department risk</CardTitle>
            <CardDescription>Stacked counts by department code. Average GPA is listed beside the chart.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DepartmentRiskChart data={data.departments} />
            <ul className="grid grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-3">
              {data.departments.map((department) => (
                <li key={department.code}>
                  <span className="font-medium text-slate-700">{department.code}</span>
                  {" · "}
                  {department.averageGpa === null ? "No GPA" : `GPA ${department.averageGpa.toFixed(2)}`}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Attendance overview</CardTitle>
            <CardDescription>Students grouped by current attendance.</CardDescription>
          </CardHeader>
          <CardContent>
            <BucketChart data={data.attendance} label="Students" />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Students requiring attention</CardTitle>
              <CardDescription>High- and medium-risk students in the current session.</CardDescription>
            </div>
            <Link href="/students?risk=high" className="text-sm font-medium text-primary">View high risk</Link>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {data.attention.length === 0 ? (
            <EmptyState title="No students need attention" description="High- and medium-risk students will appear here." />
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      {["Student", "Student ID", "Department", "GPA", "Attendance", "Risk", "Updated", ""].map((heading) => (
                        <th key={heading || "action"} className="px-4 py-3 font-medium first:pl-5">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.attention.map((student) => (
                      <tr key={student.id}>
                        <td className="px-5 py-3"><PersonIdentity name={student.name} secondary={student.email} /></td>
                        <td className="px-4 py-3">{student.studentId}</td>
                        <td className="px-4 py-3">{student.departmentCode}</td>
                        <td className="px-4 py-3">{formatGpa(student.gpa)}</td>
                        <td className="px-4 py-3">{formatPercent(student.attendance)}</td>
                        <td className="px-4 py-3"><RiskBadge level={student.riskLevel} /></td>
                        <td className="px-4 py-3">{formatDate(student.lastUpdated)}</td>
                        <td className="px-4 py-3">
                          <Link href={`/students/${student.id}`} className={buttonClassName("outline", "sm")}>View details</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-3 px-4 pb-4 lg:hidden">
                {data.attention.map((student) => (
                  <article key={student.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <PersonIdentity name={student.name} secondary={student.studentId} />
                      <RiskBadge level={student.riskLevel} />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {student.departmentCode} · GPA {formatGpa(student.gpa)} · {formatPercent(student.attendance)} · {formatDate(student.lastUpdated)}
                    </p>
                    <Link href={`/students/${student.id}`} className={`${buttonClassName("outline", "sm")} mt-3 w-full`}>View details</Link>
                  </article>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Recent alerts</CardTitle>
            <Link href="/alerts" className="text-sm font-medium text-primary">View all</Link>
          </div>
        </CardHeader>
        <CardContent>
          {data.alerts.length === 0 ? (
            <EmptyState title="No alerts" description="Early-warning alerts will appear here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.alerts.map((alert) => (
                <li key={alert.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {alert.studentMissing ? alert.studentName : (
                        <Link href={`/students/${alert.studentId}`} className="hover:text-primary">{alert.studentName}</Link>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{alert.reason}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="neutral">{alertCategoryLabel(alert.category)}</Badge>
                      <StatusBadge status={alert.status} />
                      <span className="text-xs text-slate-400">{formatDate(alert.createdAt)}</span>
                    </div>
                  </div>
                  <SeverityBadge level={alert.severity} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
