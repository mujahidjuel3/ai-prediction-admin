"use client";

import { BucketChart } from "@/components/charts/bucket-chart";
import { CourseScoreChart } from "@/components/charts/course-score-chart";
import { DepartmentRiskChart } from "@/components/charts/department-risk-chart";
import { PerformanceTrendChart } from "@/components/charts/performance-trend-chart";
import { RiskDistributionChart } from "@/components/charts/risk-distribution-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoNotice } from "@/components/ui/demo-notice";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { analyticsModel } from "@/lib/selectors";
import { useAdminState } from "@/lib/store";
import { cn, formatGpa, semesterOptions } from "@/lib/utils";
import { useState, type KeyboardEvent } from "react";

const TABS = [
  { id: "trends", label: "Performance" },
  { id: "risk", label: "Risk" },
  { id: "attendance", label: "Attendance and GPA" },
  { id: "courses", label: "Courses" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AnalyticsView() {
  const state = useAdminState();
  const [semester, setSemester] = useState("all");
  const [tab, setTab] = useState<TabId>("trends");
  const data = analyticsModel(state, semester);

  function onTabKey(event: KeyboardEvent<HTMLDivElement>) {
    const index = TABS.findIndex((item) => item.id === tab);
    if (event.key === "ArrowRight") {
      setTab(TABS[(index + 1) % TABS.length]?.id ?? tab);
    }
    if (event.key === "ArrowLeft") {
      setTab(TABS[(index - 1 + TABS.length) % TABS.length]?.id ?? tab);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Analytics"
        description="Charts from the fictional roster in this session. Student charts use each student's current semester. Course charts use the course semester."
      />
      <DemoNotice>Changing the semester filter only changes this view. It does not query a reporting service.</DemoNotice>
      <Card className="p-4">
        <div className="max-w-xs">
          <Select id="analytics-semester" label="Semester" value={semester} onChange={(event) => setSemester(event.target.value)} options={semesterOptions(true)} />
        </div>
      </Card>
      <div role="tablist" aria-label="Analytics sections" className="flex gap-2 overflow-x-auto" onKeyDown={onTabKey}>
        {TABS.map((item) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              className={cn(
                "shrink-0 rounded-md px-3 py-2 text-sm font-medium",
                selected ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200",
              )}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "trends" ? (
        <Card role="tabpanel" id="panel-trends" aria-labelledby="tab-trends">
          <CardHeader>
            <CardTitle>Performance trend</CardTitle>
            <CardDescription>
              Illustrative averages for {data.students.length} students
              {data.averageGpa === null ? "" : ` · GPA ${formatGpa(data.averageGpa)}`}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceTrendChart data={data.trend} />
          </CardContent>
        </Card>
      ) : null}

      {tab === "risk" ? (
        <div role="tabpanel" id="panel-risk" aria-labelledby="tab-risk" className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Risk distribution</CardTitle>
              <CardDescription>Current risk labels for the filtered students.</CardDescription>
            </CardHeader>
            <CardContent>
              <RiskDistributionChart data={data.risk} />
            </CardContent>
          </Card>
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Department comparison</CardTitle>
              <CardDescription>Departments with no students in the filter are shown as zero.</CardDescription>
            </CardHeader>
            <CardContent>
              <DepartmentRiskChart data={data.departments} />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "attendance" ? (
        <div role="tabpanel" id="panel-attendance" aria-labelledby="tab-attendance" className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Attendance analysis</CardTitle>
              <CardDescription>Students grouped by current attendance.</CardDescription>
            </CardHeader>
            <CardContent>
              <BucketChart data={data.attendance} label="Students" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>GPA distribution</CardTitle>
              <CardDescription>Students grouped by current GPA.</CardDescription>
            </CardHeader>
            <CardContent>
              <BucketChart data={data.gpa} label="Students" />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "courses" ? (
        <div role="tabpanel" id="panel-courses" aria-labelledby="tab-courses" className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Average course score</CardTitle>
              <CardDescription>Weighted demonstration score on a 0–100 scale.</CardDescription>
            </CardHeader>
            <CardContent>
              <CourseScoreChart data={data.courses} dataKey="averageScore" label="Average score" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>High-risk course records</CardTitle>
              <CardDescription>Share of records below 50 or attendance below 60%.</CardDescription>
            </CardHeader>
            <CardContent>
              <CourseScoreChart data={data.courses} dataKey="highRiskPercent" label="High-risk records" />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
