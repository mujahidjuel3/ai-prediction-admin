import type { RiskLevel } from "@/types/common";

export type EnrollmentStatus = "enrolled" | "on-leave";

export interface Student {
  id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  semester: number;
  enrollmentYear: number;
  enrollmentStatus: EnrollmentStatus;
  gpa: number;
  attendance: number;
  assignmentAverage: number;
  quizAverage: number;
  midtermScore: number;
  riskLevel: RiskLevel;
  lastUpdated: string;
  predictionConfidence: number | null;
}

export interface StudentInput {
  studentId: string;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  semester: number;
  enrollmentYear: number;
  enrollmentStatus: EnrollmentStatus;
  gpa: number;
  attendance: number;
  assignmentAverage: number;
  quizAverage: number;
  midtermScore: number;
}

export interface StudentProfileProvisioningFields {
  studentNumber: string;
  name: string;
  departmentId: string;
  enrollmentYear: number;
}

export type StudentAccountProvisioning =
  | { accountMode: "CREATE"; email: string; initialPassword: string }
  | { accountMode: "LINK"; userId: string };

export type CreateStudentProfileRequest = StudentProfileProvisioningFields & StudentAccountProvisioning;

export interface StudentCourseRow {
  courseId: string;
  courseCode: string;
  courseName: string;
  attendance: number;
  score: number;
  riskLevel: RiskLevel;
}
