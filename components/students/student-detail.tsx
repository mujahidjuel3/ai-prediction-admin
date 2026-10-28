"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface Profile { id:string; studentNumber:string; name:string; email:string|null; enrollmentYear:number; status:string; department:{code:string;name:string}; enrollments:{id:string;status:string;offering:{section:string;course:{code:string;name:string};term:{label:string}}}[]; summaries:{id:string;gpa:string|null;attendancePercent:string|null;assessmentAverage:string|null;calculatedAt:string;calculationVersion:string}[]; predictions:{id:string;riskLevel:string;probability:string|null;generatedAt:string;modelVersion:{version:string;targetDefinition:string}}[]; alerts:{id:string;category:string;severity:string;reason:string;status:string;createdAt:string}[]; }

export function StudentDetailView({ studentId }: { studentId: string }) {
  const [student, setStudent] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const result = await apiGet<Profile>(`/students/${encodeURIComponent(studentId)}`); setStudent(result.data); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load student."); } finally { setLoading(false); } }, [studentId]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  return <div className="space-y-5">
    <Link href="/students" className="text-sm font-medium text-primary">â† Back to students</Link>
    {loading ? <LoadingState label="Loading database student profile" /> : error ? <ErrorState description={error} onRetry={() => void load()} /> : !student ? <EmptyState title="Student not found" description="No matching student record was returned by the API." /> : <>
      <PageHeader title={student.name} description={`${student.studentNumber} Â· ${student.department.code} Â· Enrolled ${student.enrollmentYear} Â· ${student.status.toLowerCase()}`} />
      <p className="text-sm text-slate-600">{student.email ?? "No email on record"}</p>
      <Card><CardHeader><CardTitle>Enrollments</CardTitle><CardDescription>Current database enrollment records.</CardDescription></CardHeader><CardContent>{student.enrollments.length ? <ul className="divide-y divide-slate-100">{student.enrollments.map((enrollment) => <li key={enrollment.id} className="flex justify-between py-3 text-sm"><span>{enrollment.offering.course.code} Â· {enrollment.offering.course.name} Â· {enrollment.offering.term.label} Â· Section {enrollment.offering.section}</span><span>{enrollment.status.toLowerCase()}</span></li>)}</ul> : <EmptyState title="No enrollments" description="This student has no stored course enrollment records." />}</CardContent></Card>
      <Card><CardHeader><CardTitle>Academic summaries</CardTitle><CardDescription>Persisted summaries only. No scores or formula based estimates are added here.</CardDescription></CardHeader><CardContent>{student.summaries.length ? <ul className="divide-y divide-slate-100">{student.summaries.map((summary) => <li key={summary.id} className="py-3 text-sm">GPA {summary.gpa ?? "â€”"} Â· Attendance {summary.attendancePercent ?? "â€”"}% Â· Assessment average {summary.assessmentAverage ?? "â€”"} Â· {summary.calculationVersion} Â· {new Date(summary.calculatedAt).toLocaleDateString()}</li>)}</ul> : <EmptyState title="No stored summaries" description="No GPA or attendance summary is available for this student." />}</CardContent></Card>
      <Card><CardHeader><CardTitle>Prediction history</CardTitle><CardDescription>Only stored model outputs are shown. This page does not generate predictions.</CardDescription></CardHeader><CardContent>{student.predictions.length ? <ul className="divide-y divide-slate-100">{student.predictions.map((prediction) => <li key={prediction.id} className="py-3 text-sm">{prediction.riskLevel} Â· {prediction.modelVersion.version} Â· {prediction.modelVersion.targetDefinition} Â· {new Date(prediction.generatedAt).toLocaleString()}</li>)}</ul> : <EmptyState title="No stored predictions" description="Prediction generation remains unavailable until a trained model and explicit risk policy are configured." />}</CardContent></Card>
    </>}
  </div>;
}

