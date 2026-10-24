import {
  attendanceBuckets,
  averageGpa,
  averageTrend,
  countRisk,
  courseScore,
  departmentRiskRows,
  gpaBuckets,
  illustrativeTrend,
  recordRisk,
  riskDistribution,
} from "@/lib/academics";
import type { AcademicRecord } from "@/types/academic-record";
import type { Alert } from "@/types/alert";
import type {
  BucketPoint,
  CoursePerformancePoint,
  DepartmentRiskPoint,
  RiskDistributionPoint,
} from "@/types/analytics";
import type { MonthlyMetric } from "@/types/common";
import type { Course } from "@/types/course";
import type { Department } from "@/types/department";
import type { Prediction, PredictionRow } from "@/types/prediction";
import type { Student, StudentCourseRow } from "@/types/student";
import type { AdminState } from "@/types/state";
import type { Teacher } from "@/types/teacher";

export interface StudentRow extends Student {
  departmentName: string;
  departmentCode: string;
}

export interface TeacherRow extends Teacher {
  departmentName: string;
  courseCodes: string[];
  studentCount: number;
}

export interface DepartmentRow extends Department {
  headName: string;
  teacherCount: number;
  studentCount: number;
  courseCount: number;
  highRiskCount: number;
}

export interface CourseRow extends Course {
  departmentName: string;
  teacherName: string;
  studentCount: number;
  averageScore: number | null;
  highRiskPercent: number | null;
}

export interface RecordRow extends AcademicRecord {
  studentName: string;
  publicStudentId: string;
  courseCode: string;
  courseName: string;
  departmentId: string;
  departmentName: string;
}

export interface AlertRow extends Alert {
  studentName: string;
  publicStudentId: string;
  departmentName: string;
  studentMissing: boolean;
}

export interface StudentCourseResult extends StudentCourseRow {
  recordId: string;
  semester: number;
}

export interface StudentDetailModel {
  student: StudentRow;
  courses: StudentCourseResult[];
  trend: MonthlyMetric[];
  prediction: Prediction | null;
  alerts: AlertRow[];
}

function departmentName(state: AdminState, departmentId: string): string {
  return state.departments.find((department) => department.id === departmentId)?.name ?? "Unknown department";
}

function departmentCode(state: AdminState, departmentId: string): string {
  return state.departments.find((department) => department.id === departmentId)?.code ?? "—";
}

export function studentRows(state: AdminState): StudentRow[] {
  return state.students.map((student) => ({
    ...student,
    departmentName: departmentName(state, student.departmentId),
    departmentCode: departmentCode(state, student.departmentId),
  }));
}

export function teacherRows(state: AdminState): TeacherRow[] {
  return state.teachers.map((teacher) => {
    const courses = state.courses.filter((course) => course.teacherId === teacher.id);
    const studentIds = new Set(
      state.records
        .filter((record) => courses.some((course) => course.id === record.courseId))
        .map((record) => record.studentId),
    );
    return {
      ...teacher,
      departmentName: departmentName(state, teacher.departmentId),
      courseCodes: courses.map((course) => course.code),
      studentCount: studentIds.size,
    };
  });
}

export function departmentRows(state: AdminState): DepartmentRow[] {
  return state.departments.map((department) => {
    const students = state.students.filter((student) => student.departmentId === department.id);
    const head = state.teachers.find((teacher) => teacher.id === department.headTeacherId);
    return {
      ...department,
      headName: head?.name ?? "Unassigned",
      teacherCount: state.teachers.filter((teacher) => teacher.departmentId === department.id).length,
      studentCount: students.length,
      courseCount: state.courses.filter((course) => course.departmentId === department.id).length,
      highRiskCount: students.filter((student) => student.riskLevel === "high").length,
    };
  });
}

function courseStats(state: AdminState, courseId: string) {
  const records = state.records.filter((record) => record.courseId === courseId);
  if (records.length === 0) {
    return { studentCount: 0, averageScore: null, highRiskPercent: null };
  }
  const scores = records.map(courseScore);
  const high = records.filter((record) => recordRisk(record) === "high").length;
  return {
    studentCount: new Set(records.map((record) => record.studentId)).size,
    averageScore: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
    highRiskPercent: Math.round((high / records.length) * 100),
  };
}

export function courseRows(state: AdminState): CourseRow[] {
  return state.courses.map((course) => {
    const teacher = state.teachers.find((item) => item.id === course.teacherId);
    return {
      ...course,
      departmentName: departmentName(state, course.departmentId),
      teacherName: teacher?.name ?? "Unassigned",
      ...courseStats(state, course.id),
    };
  });
}

export function recordRows(state: AdminState): RecordRow[] {
  return state.records.map((record) => {
    const student = state.students.find((item) => item.id === record.studentId);
    const course = state.courses.find((item) => item.id === record.courseId);
    const departmentId = student?.departmentId ?? course?.departmentId ?? "";
    return {
      ...record,
      studentName: student?.name ?? "Removed student",
      publicStudentId: student?.studentId ?? "—",
      courseCode: course?.code ?? "—",
      courseName: course?.name ?? "Removed course",
      departmentId,
      departmentName: departmentId ? departmentName(state, departmentId) : "—",
    };
  });
}

export function alertRows(state: AdminState): AlertRow[] {
  return state.alerts.map((alert) => {
    const student = state.students.find((item) => item.id === alert.studentId);
    return {
      ...alert,
      studentName: student?.name ?? "Removed student",
      publicStudentId: student?.studentId ?? "—",
      departmentName: student ? departmentName(state, student.departmentId) : "—",
      studentMissing: !student,
    };
  });
}

export function predictionRows(state: AdminState): PredictionRow[] {
  return state.predictions.flatMap((prediction) => {
    const student = state.students.find((item) => item.id === prediction.studentId);
    if (!student) return [];
    return [
      {
        studentId: student.id,
        publicStudentId: student.studentId,
        studentName: student.name,
        departmentName: departmentName(state, student.departmentId),
        riskLevel: prediction.riskLevel,
        confidence: prediction.confidence,
        factors: prediction.factors,
        summary: prediction.summary,
        recommendation: prediction.recommendation,
        date: prediction.date,
      },
    ];
  });
}

export function studentDetail(state: AdminState, id: string): StudentDetailModel | null {
  const student = studentRows(state).find((item) => item.id === id);
  if (!student) return null;
  const courses = state.records
    .filter((record) => record.studentId === id)
    .flatMap((record) => {
      const course = state.courses.find((item) => item.id === record.courseId);
      if (!course) return [];
      return [
        {
          recordId: record.id,
          courseId: course.id,
          courseCode: course.code,
          courseName: course.name,
          attendance: record.attendance,
          score: courseScore(record),
          riskLevel: recordRisk(record),
          semester: record.semester,
        },
      ];
    });
  return {
    student,
    courses,
    trend: illustrativeTrend(
      student.gpa,
      student.attendance,
      (student.assignmentAverage + student.quizAverage + student.midtermScore) / 3,
    ),
    prediction: state.predictions.find((item) => item.studentId === id) ?? null,
    alerts: alertRows(state).filter((alert) => alert.studentId === id),
  };
}

export interface DashboardModel {
  totalStudents: number;
  totalTeachers: number;
  totalDepartments: number;
  high: number;
  medium: number;
  low: number;
  trend: MonthlyMetric[];
  risk: RiskDistributionPoint[];
  departments: DepartmentRiskPoint[];
  attendance: BucketPoint[];
  attention: StudentRow[];
  alerts: AlertRow[];
}

export function dashboardModel(state: AdminState): DashboardModel {
  const students = studentRows(state);
  const counts = countRisk(students);
  const attention = [...students]
    .filter((student) => student.riskLevel !== "low")
    .sort((left, right) => {
      const risk = countRank(right.riskLevel) - countRank(left.riskLevel);
      return risk || left.name.localeCompare(right.name);
    })
    .slice(0, 6);
  const alerts = [...alertRows(state)]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 5);

  return {
    totalStudents: students.length,
    totalTeachers: state.teachers.length,
    totalDepartments: state.departments.length,
    ...counts,
    trend: averageTrend(students),
    risk: riskDistribution(students),
    departments: departmentComparison(state, students),
    attendance: attendanceBuckets(students),
    attention,
    alerts,
  };
}

function countRank(level: Student["riskLevel"]): number {
  if (level === "high") return 3;
  if (level === "medium") return 2;
  return 1;
}

export function departmentComparison(state: AdminState, students = studentRows(state)): DepartmentRiskPoint[] {
  const fromStudents = departmentRiskRows(
    students.map((student) => ({
      code: student.departmentCode,
      department: student.departmentName,
      riskLevel: student.riskLevel,
      gpa: student.gpa,
    })),
  );
  return state.departments.map((department) => {
    const existing = fromStudents.find((item) => item.code === department.code);
    return (
      existing ?? {
        code: department.code,
        department: department.name,
        highRisk: 0,
        mediumRisk: 0,
        lowRisk: 0,
        students: 0,
        averageGpa: null,
      }
    );
  });
}

export function coursePerformance(state: AdminState, semester = "all"): CoursePerformancePoint[] {
  return courseRows(state)
    .filter((course) => semester === "all" || course.semester === Number(semester))
    .map((course) => ({
      code: course.code,
      course: course.name,
      averageScore: course.averageScore,
      highRiskPercent: course.highRiskPercent,
      students: course.studentCount,
    }));
}

export function filterStudentsBySemester(students: StudentRow[], semester: string): StudentRow[] {
  if (semester === "all") return students;
  return students.filter((student) => student.semester === Number(semester));
}

export function analyticsModel(state: AdminState, semester: string) {
  const students = filterStudentsBySemester(studentRows(state), semester);
  return {
    students,
    trend: averageTrend(students),
    risk: riskDistribution(students),
    departments: departmentComparison(state, students),
    attendance: attendanceBuckets(students),
    gpa: gpaBuckets(students),
    courses: coursePerformance(state, semester),
    averageGpa: averageGpa(students),
  };
}

export function notificationVisible(
  state: AdminState,
  notification: AdminState["notifications"][number],
): boolean {
  const preferences = state.settings.notifications;
  if (!preferences.highRiskAlerts && notification.severity === "high") return false;
  if (!preferences.attendanceAlerts) {
    const alert = state.alerts.find((item) => item.id === notification.alertId);
    if (alert?.category === "attendance") return false;
  }
  return true;
}

export function unreadCount(state: AdminState): number {
  return state.notifications.filter(
    (notification) => !notification.read && notificationVisible(state, notification),
  ).length;
}

export function alertSummary(state: AdminState) {
  return {
    total: state.alerts.length,
    high: state.alerts.filter((alert) => alert.severity === "high").length,
    medium: state.alerts.filter((alert) => alert.severity === "medium").length,
    resolved: state.alerts.filter((alert) => alert.status === "resolved").length,
  };
}
