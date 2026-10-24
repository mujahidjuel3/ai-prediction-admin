import type { AcademicRecord } from "@/types/academic-record";
import type { BucketPoint, DepartmentRiskPoint, RiskDistributionPoint } from "@/types/analytics";
import type { FactorLevel, MonthlyMetric, RiskLevel } from "@/types/common";
import type { AcademicThresholds } from "@/types/settings";
import type { Student } from "@/types/student";

export const RISK_RANK: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export const NEW_PREDICTION_SUMMARY =
  "Demonstration estimate from the academic indicators entered in this session. No prediction model was called.";

const MONTHS = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"] as const;

export function deriveRisk(
  gpa: number,
  attendance: number,
  thresholds: AcademicThresholds,
): RiskLevel {
  if (gpa < thresholds.highRiskGpa || attendance < thresholds.highRiskAttendance) {
    return "high";
  }
  if (gpa < thresholds.mediumRiskGpa || attendance < thresholds.mediumRiskAttendance) {
    return "medium";
  }
  return "low";
}

function scoreBand(value: number, low: number, moderate: number): FactorLevel {
  if (value < low) return "low";
  if (value < moderate) return "moderate";
  return "good";
}

export function deriveFactors(
  student: Pick<Student, "gpa" | "attendance" | "assignmentAverage" | "midtermScore">,
) {
  return [
    { name: "Attendance", level: scoreBand(student.attendance, 60, 75) },
    { name: "Assignments", level: scoreBand(student.assignmentAverage, 50, 70) },
    { name: "Midterm", level: scoreBand(student.midtermScore, 50, 70) },
    { name: "GPA", level: scoreBand(student.gpa, 2.5, 3) },
  ];
}

export function defaultRecommendation(level: RiskLevel): string {
  if (level === "high") {
    return "Arrange an advising meeting this week and agree a recovery plan for attendance and the weakest assessments.";
  }
  if (level === "medium") {
    return "Review attendance and upcoming assessments before the next progress checkpoint.";
  }
  return "No immediate intervention is indicated. Continue routine monitoring.";
}

export function courseScore(record: Pick<AcademicRecord, "assignment" | "quiz" | "midterm" | "finalMark">): number {
  return Math.round(
    record.assignment * 0.25 +
      record.quiz * 0.2 +
      record.midterm * 0.25 +
      record.finalMark * 0.3,
  );
}

export function recordRisk(record: AcademicRecord): RiskLevel {
  const score = courseScore(record);
  if (score < 50 || record.attendance < 60) return "high";
  if (score < 65 || record.attendance < 75) return "medium";
  return "low";
}

export function illustrativeTrend(
  gpa: number,
  attendance: number,
  assessment: number,
): MonthlyMetric[] {
  return MONTHS.map((month, index) => {
    const drift = (index - 2.5) * 0.04;
    return {
      month,
      gpa: Number(Math.min(4, Math.max(0, gpa + drift)).toFixed(2)),
      attendance: Math.min(100, Math.max(0, Math.round(attendance + drift * 8))),
      assessment: Math.min(100, Math.max(0, Math.round(assessment + drift * 6))),
    };
  });
}

export function averageTrend(students: Student[]): MonthlyMetric[] {
  if (students.length === 0) {
    return MONTHS.map((month) => ({ month, gpa: 0, attendance: 0, assessment: 0 }));
  }
  const series = students.map((student) =>
    illustrativeTrend(
      student.gpa,
      student.attendance,
      (student.assignmentAverage + student.quizAverage + student.midtermScore) / 3,
    ),
  );
  return MONTHS.map((month, index) => {
    const gpa = series.reduce((sum, item) => sum + (item[index]?.gpa ?? 0), 0) / series.length;
    const attendance =
      series.reduce((sum, item) => sum + (item[index]?.attendance ?? 0), 0) / series.length;
    const assessment =
      series.reduce((sum, item) => sum + (item[index]?.assessment ?? 0), 0) / series.length;
    return {
      month,
      gpa: Number(gpa.toFixed(2)),
      attendance: Math.round(attendance),
      assessment: Math.round(assessment),
    };
  });
}

export function countRisk(students: Array<{ riskLevel: RiskLevel }>) {
  return {
    high: students.filter((student) => student.riskLevel === "high").length,
    medium: students.filter((student) => student.riskLevel === "medium").length,
    low: students.filter((student) => student.riskLevel === "low").length,
  };
}

export function riskDistribution(
  students: Array<{ riskLevel: RiskLevel }>,
): RiskDistributionPoint[] {
  const counts = countRisk(students);
  return [
    { level: "high", count: counts.high },
    { level: "medium", count: counts.medium },
    { level: "low", count: counts.low },
  ];
}

export function attendanceBuckets(students: Array<{ attendance: number }>): BucketPoint[] {
  const ranges = [
    { range: "Below 60%", test: (value: number) => value < 60 },
    { range: "60–74%", test: (value: number) => value >= 60 && value < 75 },
    { range: "75–84%", test: (value: number) => value >= 75 && value < 85 },
    { range: "85–100%", test: (value: number) => value >= 85 },
  ];
  return ranges.map((range) => ({
    range: range.range,
    count: students.filter((student) => range.test(student.attendance)).length,
  }));
}

export function gpaBuckets(students: Array<{ gpa: number }>): BucketPoint[] {
  const ranges = [
    { range: "Below 2.00", test: (value: number) => value < 2 },
    { range: "2.00–2.49", test: (value: number) => value >= 2 && value < 2.5 },
    { range: "2.50–2.99", test: (value: number) => value >= 2.5 && value < 3 },
    { range: "3.00–3.49", test: (value: number) => value >= 3 && value < 3.5 },
    { range: "3.50–4.00", test: (value: number) => value >= 3.5 },
  ];
  return ranges.map((range) => ({
    range: range.range,
    count: students.filter((student) => range.test(student.gpa)).length,
  }));
}

export function averageGpa(students: Array<{ gpa: number }>): number | null {
  if (students.length === 0) return null;
  const total = students.reduce((sum, student) => sum + student.gpa, 0);
  return Number((total / students.length).toFixed(2));
}

export function departmentRiskRows(
  rows: Array<{ code: string; department: string; riskLevel: RiskLevel; gpa: number }>,
): DepartmentRiskPoint[] {
  const codes = [...new Set(rows.map((row) => row.code))];
  return codes.map((code) => {
    const group = rows.filter((row) => row.code === code);
    const counts = countRisk(group);
    return {
      code,
      department: group[0]?.department ?? code,
      highRisk: counts.high,
      mediumRisk: counts.medium,
      lowRisk: counts.low,
      students: group.length,
      averageGpa: averageGpa(group),
    };
  });
}
