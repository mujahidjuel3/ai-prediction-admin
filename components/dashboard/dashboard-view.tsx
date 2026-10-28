"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { apiGet } from "@/lib/api";
import { BookOpen, Building2, GraduationCap, Users, BellRing, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface Summary { students: number; departments: number; teachers: number; courses: number; offerings: number; openAlerts: number; }
interface Analytics { studentCount: number; predictionCount: number; alertsBySeverityAndStatus: { severity: string; status: string; _count: number }[]; }

export function DashboardView() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [s, a] = await Promise.all([apiGet<Summary>("/dashboard/summary"), apiGet<Analytics>("/analytics/summary")]);
      setSummary(s.data); setAnalytics(a.data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load dashboard data."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return <div className="space-y-6">
    <PageHeader title="Administration overview" description="Live counts from the Academic Sentinel database. Prediction and risk metrics appear only when supported by stored model outputs." />
    {loading ? <LoadingState label="Loading database summary" /> : error ? <ErrorState description={error} onRetry={() => void load()} /> : summary && analytics ? <>
      <section className="grid grid-cols-1 gap-4 xs:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Students" value={summary.students} icon={Users} href="/students" />
        <StatCard label="Teachers" value={summary.teachers} icon={GraduationCap} href="/teachers" />
        <StatCard label="Departments" value={summary.departments} icon={Building2} href="/departments" />
        <StatCard label="Courses" value={summary.courses} icon={BookOpen} href="/courses" />
        <StatCard label="Offerings" value={summary.offerings} icon={BookOpen} href="/courses" />
        <StatCard label="Open alerts" value={summary.openAlerts} icon={BellRing} href="/alerts" />
      </section>
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card><CardHeader><CardTitle>Prediction status</CardTitle><CardDescription>Stored model results only. This screen does not generate predictions.</CardDescription></CardHeader><CardContent>
          {analytics.predictionCount === 0 ? <EmptyState title="No stored predictions" description="Prediction generation is unavailable until an approved trained model and explicit risk policy are configured." /> : <p className="text-2xl font-semibold">{analytics.predictionCount} stored predictions</p>}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Alerts by stored severity and status</CardTitle><CardDescription>Database alert records; no risk labels are inferred from student data.</CardDescription></CardHeader><CardContent>
          {analytics.alertsBySeverityAndStatus.length === 0 ? <EmptyState title="No alert aggregates" description="There are no stored alerts for the current scope." /> : <ul className="divide-y divide-slate-100">{analytics.alertsBySeverityAndStatus.map((row) => <li key={`${row.severity}-${row.status}`} className="flex justify-between py-2 text-sm"><span className="capitalize">{row.severity.toLowerCase()} · {row.status.toLowerCase()}</span><strong>{row._count}</strong></li>)}</ul>}
        </CardContent></Card>
      </section>
      <Card><CardHeader><CardTitle><span className="inline-flex items-center gap-2"><ShieldAlert className="h-4 w-4" />Risk analytics</span></CardTitle></CardHeader><CardContent><p className="text-sm text-slate-600">Risk distribution, attendance trends, and GPA analytics are unavailable because the database schema has no approved summary or grading policy to calculate them from.</p><Link className="mt-3 inline-flex text-sm font-medium text-primary" href="/analytics">Open analytics</Link></CardContent></Card>
    </> : null}
  </div>;
}
