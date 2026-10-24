"use client";

import { PerformanceTrendChart } from "@/components/charts/performance-trend-chart";
import { StudentForm } from "@/components/students/student-form";
import { buttonClassName } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DemoNotice } from "@/components/ui/demo-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { Feedback } from "@/components/ui/feedback";
import { FactorBadge, RiskBadge, SeverityBadge, StatusBadge } from "@/components/ui/status-badges";
import { Avatar } from "@/components/ui/avatar";
import { deleteStudent, useAdminState } from "@/lib/store";
import { studentDetail } from "@/lib/selectors";
import {
  alertCategoryLabel,
  formatConfidence,
  formatDate,
  formatGpa,
  formatPercent,
  statusLabel,
} from "@/lib/utils";
import { BookOpen, ClipboardCheck, GraduationCap, Percent, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

export function StudentDetailView({ studentId }: { studentId: string }) {
  const state = useAdminState();
  const detail = studentDetail(state, studentId);
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");

  if (!detail) {
    return (
      <EmptyState
        title="Student not found"
        description="This ID is not in the current demonstration session. It may have been removed, or it was never part of the sample roster."
        action={
          <Link href="/students" className={buttonClassName("primary", "sm")}>
            Back to students
          </Link>
        }
      />
    );
  }

  const { student, courses, trend, prediction, alerts } = detail;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link href="/students" className={buttonClassName("outline", "sm")}>Back to students</Link>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
        <Button variant="ghost" size="sm" className="text-danger" onClick={() => setConfirming(true)}>Delete</Button>
      </div>
      <Feedback message={message} />
      <Card>
        <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={student.name} size="lg" />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold text-slate-900">{student.name}</h1>
              <p className="mt-1 text-sm text-slate-500">{student.studentId} · {student.departmentName}</p>
              <p className="truncate text-sm text-slate-500">{student.email}</p>
              <p className="text-sm text-slate-500">{student.phone}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge level={student.riskLevel} />
            <span className="text-sm text-slate-500">Semester {student.semester}</span>
            <span className="text-sm text-slate-500">{statusLabel(student.enrollmentStatus)}</span>
          </div>
        </CardContent>
      </Card>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric label="Current GPA" value={formatGpa(student.gpa)} icon={<GraduationCap className="h-4 w-4" aria-hidden="true" />} />
        <Metric label="Attendance" value={formatPercent(student.attendance)} icon={<Percent className="h-4 w-4" aria-hidden="true" />} />
        <Metric label="Assignments" value={formatPercent(student.assignmentAverage)} icon={<ClipboardCheck className="h-4 w-4" aria-hidden="true" />} />
        <Metric label="Quizzes" value={formatPercent(student.quizAverage)} icon={<BookOpen className="h-4 w-4" aria-hidden="true" />} />
        <Metric label="Midterm" value={formatPercent(student.midtermScore)} icon={<Sparkles className="h-4 w-4" aria-hidden="true" />} />
      </section>

      <p className="text-sm text-slate-500">
        Enrolled {student.enrollmentYear}. Profile last updated {formatDate(student.lastUpdated)}.
      </p>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Performance history</CardTitle>
            <CardDescription>
              Illustrative six-month shape derived from the current snapshot. It is not a stored academic history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceTrendChart data={trend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Prediction summary</CardTitle>
            <CardDescription>Demonstration copy. Confidence is omitted when the sample does not define it.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {prediction ? (
              <>
                <RiskBadge level={prediction.riskLevel} />
                <p className="text-sm text-slate-600">{prediction.summary}</p>
                <p className="text-sm text-slate-500">Confidence: {formatConfidence(prediction.confidence)}</p>
                <p className="text-sm text-slate-500">Date: {formatDate(prediction.date)}</p>
                <Link href="/predictions" className="inline-flex text-sm font-medium text-primary">
                  View all predictions
                </Link>
              </>
            ) : (
              <p className="text-sm text-slate-500">No prediction row is stored for this student.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Risk factors</CardTitle>
            <CardDescription>Bands are derived from the current indicators, not from a trained model.</CardDescription>
          </CardHeader>
          <CardContent>
            {prediction ? (
              <ul className="space-y-3">
                {prediction.factors.map((factor) => (
                  <li key={factor.name} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-700">{factor.name}</span>
                    <FactorBadge level={factor.level} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No factors are available.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recommendation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              {prediction?.recommendation ?? "No recommendation is stored for this student."}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Course-wise performance</CardTitle>
          <CardDescription>
            Weighted score: 25% assignment, 20% quiz, 25% midterm, 30% final. This formula is part of the demonstration only.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {courses.length === 0 ? (
            <EmptyState title="No course records" description="Academic records for this student will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Course</th>
                    <th className="px-4 py-3 font-medium">Semester</th>
                    <th className="px-4 py-3 font-medium">Attendance</th>
                    <th className="px-4 py-3 font-medium">Score</th>
                    <th className="px-4 py-3 font-medium">Record risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courses.map((course) => (
                    <tr key={course.recordId}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">{course.courseName}</p>
                        <p className="text-xs text-slate-500">{course.courseCode}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{course.semester}</td>
                      <td className="px-4 py-3 text-slate-700">{formatPercent(course.attendance)}</td>
                      <td className="px-4 py-3 text-slate-700">{course.score}</td>
                      <td className="px-4 py-3"><RiskBadge level={course.riskLevel} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Related alerts</CardTitle>
            <Link href="/alerts" className="text-sm font-medium text-primary">View all alerts</Link>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-sm text-slate-500">No early-warning alerts are linked to this student.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {alerts.map((alert) => (
                <li key={alert.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityBadge level={alert.severity} />
                      <StatusBadge status={alert.status} />
                      <span className="text-xs text-slate-500">{alertCategoryLabel(alert.category)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{alert.reason}</p>
                    <p className="mt-1 text-sm text-slate-500">{alert.recommendedAction}</p>
                  </div>
                  <p className="shrink-0 text-xs text-slate-500">{formatDate(alert.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <DemoNotice>
        Editing this profile updates the session risk label from the settings thresholds. It does not call a prediction service.
      </DemoNotice>

      {editing ? (
        <StudentForm student={student} onClose={() => setEditing(false)} onSaved={setMessage} />
      ) : null}
      <ConfirmDialog
        open={confirming}
        title="Delete student"
        description={`Remove ${student.name} and the related demonstration records from this session?`}
        confirmLabel="Delete student"
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          deleteStudent(student.id);
          router.push("/students");
        }}
      />
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2 text-slate-500">
        <p className="text-xs">{label}</p>
        {icon}
      </div>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
