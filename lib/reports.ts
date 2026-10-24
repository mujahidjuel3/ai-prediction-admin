import { formatConfidence, formatGpa, formatPercent, riskLabel } from "@/lib/utils";
import {
  courseRows,
  departmentRows,
  filterStudentsBySemester,
  studentRows,
  type StudentRow,
} from "@/lib/selectors";
import type { RiskLevel } from "@/types/common";
import type { AdminState } from "@/types/state";

export type ReportKind =
  | "performance"
  | "high-risk"
  | "departments"
  | "attendance"
  | "courses";

export interface ReportFilters {
  departmentId: string;
  semester: string;
  risk: string;
  query: string;
}

export interface ReportTable {
  title: string;
  description: string;
  filename: string;
  columns: string[];
  rows: string[][];
}

function matchesDepartment(departmentId: string, selected: string): boolean {
  return selected === "all" || departmentId === selected;
}

function matchesSemester(semester: number, selected: string): boolean {
  return selected === "all" || semester === Number(selected);
}

function studentScope(state: AdminState, filters: ReportFilters, risk?: RiskLevel | "all"): StudentRow[] {
  const selectedRisk = risk ?? (filters.risk === "all" ? "all" : (filters.risk as RiskLevel));
  return filterStudentsBySemester(studentRows(state), filters.semester).filter((student) => {
    const departmentOk = matchesDepartment(student.departmentId, filters.departmentId);
    const riskOk = selectedRisk === "all" || student.riskLevel === selectedRisk;
    return departmentOk && riskOk;
  });
}

function predictionFor(state: AdminState, studentId: string) {
  return state.predictions.find((prediction) => prediction.studentId === studentId);
}

export function buildReport(
  state: AdminState,
  kind: ReportKind,
  filters: ReportFilters,
): ReportTable {
  if (kind === "departments") {
    const rows = departmentRows(state)
      .filter((department) => matchesDepartment(department.id, filters.departmentId))
      .map((department) => {
        const students = filterStudentsBySemester(studentRows(state), filters.semester).filter(
          (student) => student.departmentId === department.id,
        );
        const courses = state.courses.filter(
          (course) =>
            course.departmentId === department.id &&
            matchesSemester(course.semester, filters.semester),
        );
        const gpaValues = students.map((student) => student.gpa);
        const average =
          gpaValues.length === 0
            ? "—"
            : formatGpa(gpaValues.reduce((sum, value) => sum + value, 0) / gpaValues.length);
        return [
          department.name,
          department.code,
          department.headName,
          String(state.teachers.filter((teacher) => teacher.departmentId === department.id).length),
          String(students.length),
          String(courses.length),
          average,
          String(students.filter((student) => student.riskLevel === "high").length),
        ];
      });
    return {
      title: "Department summary",
      description:
        "Teacher counts include the whole department. Student, course, GPA, and risk counts follow the semester filter.",
      filename: "demo-department-summary.csv",
      columns: ["Department", "Code", "Head", "Teachers", "Students", "Courses", "Average GPA", "High-risk students"],
      rows,
    };
  }

  if (kind === "courses") {
    const rows = courseRows(state)
      .filter(
        (course) =>
          matchesDepartment(course.departmentId, filters.departmentId) &&
          matchesSemester(course.semester, filters.semester),
      )
      .map((course) => [
        course.name,
        course.code,
        course.departmentName,
        String(course.semester),
        course.teacherName,
        String(course.studentCount),
        course.averageScore === null ? "—" : String(course.averageScore),
        course.highRiskPercent === null ? "—" : formatPercent(course.highRiskPercent),
      ]);
    return {
      title: "Course performance",
      description:
        "Average score uses the demonstration weighting: 25% assignment, 20% quiz, 25% midterm, and 30% final. High-risk percentage counts course records below 50 or attendance below 60%.",
      filename: "demo-course-performance.csv",
      columns: ["Course", "Code", "Department", "Semester", "Teacher", "Students", "Average score", "High-risk records"],
      rows,
    };
  }

  if (kind === "attendance") {
    const threshold = state.settings.thresholds.minimumAttendance;
    const rows = studentScope(state, filters, "all").map((student) => [
      student.name,
      student.studentId,
      student.departmentName,
      String(student.semester),
      formatPercent(student.attendance),
      formatPercent(threshold),
      student.attendance < threshold ? "Below threshold" : "Meets threshold",
    ]);
    return {
      title: "Attendance report",
      description: `Standing is compared with the demonstration minimum attendance of ${threshold}%.`,
      filename: "demo-attendance-report.csv",
      columns: ["Student", "Student ID", "Department", "Semester", "Attendance", "Threshold", "Standing"],
      rows,
    };
  }

  const risk = kind === "high-risk" ? "high" : undefined;
  const students = studentScope(state, filters, risk);
  if (kind === "high-risk") {
    const rows = students.map((student) => {
      const prediction = predictionFor(state, student.id);
      const factors = prediction?.factors.map((factor) => factor.name).join("; ") || "—";
      return [
        student.name,
        student.studentId,
        student.departmentName,
        String(student.semester),
        formatGpa(student.gpa),
        formatPercent(student.attendance),
        formatConfidence(prediction?.confidence ?? null),
        factors,
        prediction?.recommendation ?? "—",
      ];
    });
    return {
      title: "High-risk student report",
      description:
        "Limited to students currently labelled high risk by the demonstration thresholds. Confidence is shown only where the sample row defines it.",
      filename: "demo-high-risk-students.csv",
      columns: ["Student", "Student ID", "Department", "Semester", "GPA", "Attendance", "Confidence", "Factors", "Recommendation"],
      rows,
    };
  }

  const rows = students.map((student) => [
    student.name,
    student.studentId,
    student.departmentName,
    String(student.semester),
    formatGpa(student.gpa),
    formatPercent(student.attendance),
    formatPercent(student.assignmentAverage),
    formatPercent(student.quizAverage),
    formatPercent(student.midtermScore),
    riskLabel(student.riskLevel),
  ]);
  return {
    title: "Student performance",
    description: "Student summary fields from the current demonstration session.",
    filename: "demo-student-performance.csv",
    columns: ["Student", "Student ID", "Department", "Semester", "GPA", "Attendance", "Assignments", "Quizzes", "Midterm", "Risk"],
    rows,
  };
}

export function filterReportRows(rows: string[][], query: string): string[][] {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) => row.some((cell) => cell.toLowerCase().includes(needle)));
}
