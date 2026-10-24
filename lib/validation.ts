import { CURRENT_ADMIN_ID, PAGE_SIZE_OPTIONS, SEMESTERS } from "@/lib/constants";
import type { AcademicRecordInput } from "@/types/academic-record";
import type { CourseInput } from "@/types/course";
import type { FieldErrors } from "@/types/common";
import type { DepartmentInput } from "@/types/department";
import type { AcademicThresholds, AdminProfile, SystemPreferences } from "@/types/settings";
import type { EnrollmentStatus, StudentInput } from "@/types/student";
import type { TeacherInput } from "@/types/teacher";
import type { AdminState } from "@/types/state";
import type { UserInput, UserRole, UserStatus } from "@/types/user";
import type { TeacherStatus } from "@/types/teacher";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{2,20}$/;
const COURSE_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 .&-]{1,20}$/;

function clean(value: string): string {
  return value.trim();
}

function isPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 && /^[0-9+\-()\s]+$/.test(value);
}

function readNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function unique(
  errors: FieldErrors,
  field: string,
  taken: boolean,
  message: string,
) {
  if (taken) errors[field] = message;
}

export interface StudentFormValues {
  studentId: string;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  semester: string;
  enrollmentYear: string;
  enrollmentStatus: EnrollmentStatus;
  gpa: string;
  attendance: string;
  assignmentAverage: string;
  quizAverage: string;
  midtermScore: string;
}

export function emptyStudentForm(departmentId = ""): StudentFormValues {
  return {
    studentId: "",
    name: "",
    email: "",
    phone: "",
    departmentId,
    semester: "1",
    enrollmentYear: "2024",
    enrollmentStatus: "enrolled",
    gpa: "",
    attendance: "",
    assignmentAverage: "",
    quizAverage: "",
    midtermScore: "",
  };
}

export function studentToForm(student: StudentInput & { studentId: string }): StudentFormValues {
  return {
    studentId: student.studentId,
    name: student.name,
    email: student.email,
    phone: student.phone,
    departmentId: student.departmentId,
    semester: String(student.semester),
    enrollmentYear: String(student.enrollmentYear),
    enrollmentStatus: student.enrollmentStatus,
    gpa: String(student.gpa),
    attendance: String(student.attendance),
    assignmentAverage: String(student.assignmentAverage),
    quizAverage: String(student.quizAverage),
    midtermScore: String(student.midtermScore),
  };
}

function percentError(value: string, label: string): string | null {
  const number = readNumber(value);
  if (number === null || number < 0 || number > 100) {
    return `${label} must be a number from 0 to 100.`;
  }
  return null;
}

export function validateStudentForm(
  values: StudentFormValues,
  state: AdminState,
  currentId?: string,
): { errors: FieldErrors; value: StudentInput | null } {
  const errors: FieldErrors = {};
  const studentId = clean(values.studentId);
  const name = clean(values.name);
  const email = clean(values.email).toLowerCase();
  const phone = clean(values.phone);

  if (!IDENTIFIER_PATTERN.test(studentId)) {
    errors.studentId = "Use 3–21 letters, numbers, or hyphens. Example: CSE-2022-014.";
  }
  if (name.length < 2 || name.length > 80) errors.name = "Enter the student's name.";
  if (!EMAIL_PATTERN.test(email) || email.length > 120) errors.email = "Enter a valid email address.";
  if (!isPhone(phone)) errors.phone = "Enter a phone number with 7 to 15 digits.";
  if (!state.departments.some((department) => department.id === values.departmentId)) {
    errors.departmentId = "Select a department.";
  }

  const semester = readNumber(values.semester);
  if (semester === null || !SEMESTERS.includes(semester as (typeof SEMESTERS)[number])) {
    errors.semester = "Select a semester from 1 to 8.";
  }
  const enrollmentYear = readNumber(values.enrollmentYear);
  if (
    enrollmentYear === null ||
    !Number.isInteger(enrollmentYear) ||
    enrollmentYear < 2015 ||
    enrollmentYear > 2026
  ) {
    errors.enrollmentYear = "Enter an enrollment year from 2015 to 2026.";
  }

  const gpa = readNumber(values.gpa);
  if (gpa === null || gpa < 0 || gpa > 4) errors.gpa = "GPA must be from 0 to 4.";
  const attendanceError = percentError(values.attendance, "Attendance");
  const assignmentError = percentError(values.assignmentAverage, "Assignment average");
  const quizError = percentError(values.quizAverage, "Quiz average");
  const midtermError = percentError(values.midtermScore, "Midterm score");
  if (attendanceError) errors.attendance = attendanceError;
  if (assignmentError) errors.assignmentAverage = assignmentError;
  if (quizError) errors.quizAverage = quizError;
  if (midtermError) errors.midtermScore = midtermError;

  unique(
    errors,
    "studentId",
    state.students.some(
      (student) =>
        student.id !== currentId && student.studentId.toLowerCase() === studentId.toLowerCase(),
    ),
    "A student with this ID is already in the session.",
  );
  unique(
    errors,
    "email",
    state.students.some(
      (student) => student.id !== currentId && student.email.toLowerCase() === email,
    ),
    "A student with this email is already in the session.",
  );

  if (Object.keys(errors).length > 0 || gpa === null || semester === null || enrollmentYear === null) {
    return { errors, value: null };
  }

  const attendance = Number(values.attendance);
  const assignmentAverage = Number(values.assignmentAverage);
  const quizAverage = Number(values.quizAverage);
  const midtermScore = Number(values.midtermScore);

  return {
    errors,
    value: {
      studentId,
      name,
      email,
      phone,
      departmentId: values.departmentId,
      semester,
      enrollmentYear,
      enrollmentStatus: values.enrollmentStatus,
      gpa: Math.round(gpa * 100) / 100,
      attendance: Math.round(attendance * 10) / 10,
      assignmentAverage: Math.round(assignmentAverage * 10) / 10,
      quizAverage: Math.round(quizAverage * 10) / 10,
      midtermScore: Math.round(midtermScore * 10) / 10,
    },
  };
}

export interface TeacherFormValues {
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  status: TeacherStatus;
}

export function emptyTeacherForm(departmentId = ""): TeacherFormValues {
  return {
    employeeId: "",
    name: "",
    email: "",
    phone: "",
    departmentId,
    status: "active",
  };
}

export function validateTeacherForm(
  values: TeacherFormValues,
  state: AdminState,
  currentId?: string,
): { errors: FieldErrors; value: TeacherInput | null } {
  const errors: FieldErrors = {};
  const employeeId = clean(values.employeeId);
  const name = clean(values.name);
  const email = clean(values.email).toLowerCase();
  const phone = clean(values.phone);

  if (!IDENTIFIER_PATTERN.test(employeeId)) {
    errors.employeeId = "Use 3–21 letters, numbers, or hyphens. Example: EMP-1041.";
  }
  if (name.length < 2 || name.length > 80) errors.name = "Enter the teacher's name.";
  if (!EMAIL_PATTERN.test(email) || email.length > 120) errors.email = "Enter a valid email address.";
  if (!isPhone(phone)) errors.phone = "Enter a phone number with 7 to 15 digits.";
  if (!state.departments.some((department) => department.id === values.departmentId)) {
    errors.departmentId = "Select a department.";
  }
  unique(
    errors,
    "employeeId",
    state.teachers.some(
      (teacher) =>
        teacher.id !== currentId && teacher.employeeId.toLowerCase() === employeeId.toLowerCase(),
    ),
    "A teacher with this employee ID is already in the session.",
  );
  unique(
    errors,
    "email",
    state.teachers.some(
      (teacher) => teacher.id !== currentId && teacher.email.toLowerCase() === email,
    ),
    "A teacher with this email is already in the session.",
  );

  if (Object.keys(errors).length > 0) return { errors, value: null };
  return {
    errors,
    value: {
      employeeId,
      name,
      email,
      phone,
      departmentId: values.departmentId,
      status: values.status,
    },
  };
}

export interface DepartmentFormValues {
  name: string;
  code: string;
  headTeacherId: string;
}

export function validateDepartmentForm(
  values: DepartmentFormValues,
  state: AdminState,
  currentId?: string,
): { errors: FieldErrors; value: DepartmentInput | null } {
  const errors: FieldErrors = {};
  const name = clean(values.name);
  const code = clean(values.code).toUpperCase();
  if (name.length < 2 || name.length > 80) errors.name = "Enter the department name.";
  if (!/^[A-Z]{2,6}$/.test(code)) errors.code = "Use 2 to 6 letters. Example: CSE.";
  if (!state.teachers.some((teacher) => teacher.id === values.headTeacherId)) {
    errors.headTeacherId = "Select a head of department.";
  }
  unique(
    errors,
    "code",
    state.departments.some(
      (department) => department.id !== currentId && department.code.toUpperCase() === code,
    ),
    "A department with this code is already in the session.",
  );
  unique(
    errors,
    "name",
    state.departments.some(
      (department) =>
        department.id !== currentId && department.name.toLowerCase() === name.toLowerCase(),
    ),
    "A department with this name is already in the session.",
  );
  if (Object.keys(errors).length > 0) return { errors, value: null };
  return { errors, value: { name, code, headTeacherId: values.headTeacherId } };
}

export interface CourseFormValues {
  name: string;
  code: string;
  departmentId: string;
  semester: string;
  teacherId: string;
  credits: string;
}

export function validateCourseForm(
  values: CourseFormValues,
  state: AdminState,
  currentId?: string,
): { errors: FieldErrors; value: CourseInput | null } {
  const errors: FieldErrors = {};
  const name = clean(values.name);
  const code = clean(values.code).replace(/\s+/g, " ");
  const semester = readNumber(values.semester);
  const credits = readNumber(values.credits);

  if (name.length < 2 || name.length > 80) errors.name = "Enter the course name.";
  if (!COURSE_CODE_PATTERN.test(code)) errors.code = "Enter a course code such as CSE 310.";
  if (!state.departments.some((department) => department.id === values.departmentId)) {
    errors.departmentId = "Select a department.";
  }
  if (semester === null || !SEMESTERS.includes(semester as (typeof SEMESTERS)[number])) {
    errors.semester = "Select a semester from 1 to 8.";
  }
  if (values.teacherId && !state.teachers.some((teacher) => teacher.id === values.teacherId)) {
    errors.teacherId = "Select an assigned teacher or leave the course unassigned.";
  }
  if (credits === null || !Number.isInteger(credits) || credits < 1 || credits > 6) {
    errors.credits = "Credits must be a whole number from 1 to 6.";
  }
  unique(
    errors,
    "code",
    state.courses.some(
      (course) => course.id !== currentId && course.code.toLowerCase() === code.toLowerCase(),
    ),
    "A course with this code is already in the session.",
  );

  if (Object.keys(errors).length > 0 || semester === null || credits === null) {
    return { errors, value: null };
  }
  return {
    errors,
    value: {
      name,
      code,
      departmentId: values.departmentId,
      semester,
      teacherId: values.teacherId || null,
      credits,
    },
  };
}

export interface UserFormValues {
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export function validateUserForm(
  values: UserFormValues,
  state: AdminState,
  currentId?: string,
): { errors: FieldErrors; value: UserInput | null } {
  const errors: FieldErrors = {};
  const name = clean(values.name);
  const email = clean(values.email).toLowerCase();
  if (name.length < 2 || name.length > 80) errors.name = "Enter the user's name.";
  if (!EMAIL_PATTERN.test(email) || email.length > 120) errors.email = "Enter a valid email address.";
  unique(
    errors,
    "email",
    state.users.some((user) => user.id !== currentId && user.email.toLowerCase() === email),
    "A user with this email is already in the session.",
  );
  if (Object.keys(errors).length > 0) return { errors, value: null };
  return { errors, value: { name, email, role: values.role, status: values.status } };
}

export function validateProfile(
  values: AdminProfile,
  state: AdminState,
): { errors: FieldErrors; value: AdminProfile | null } {
  const errors: FieldErrors = {};
  const name = clean(values.name);
  const email = clean(values.email).toLowerCase();
  const title = clean(values.title);
  const office = clean(values.office);
  if (name.length < 2 || name.length > 80) errors.name = "Enter your name.";
  if (!EMAIL_PATTERN.test(email) || email.length > 120) errors.email = "Enter a valid email address.";
  if (title.length < 2 || title.length > 80) errors.title = "Enter your title.";
  if (office.length < 2 || office.length > 80) errors.office = "Enter your office.";
  unique(
    errors,
    "email",
    state.users.some((user) => user.id !== CURRENT_ADMIN_ID && user.email.toLowerCase() === email),
    "Another user already has this email.",
  );
  if (Object.keys(errors).length > 0) return { errors, value: null };
  return { errors, value: { name, email, title, office } };
}

export function validateThresholds(
  values: AcademicThresholds,
): { errors: FieldErrors; value: AcademicThresholds | null } {
  const errors: FieldErrors = {};
  const fields: Array<[keyof AcademicThresholds, string, number, number]> = [
    ["highRiskGpa", "High-risk GPA", 0, 4],
    ["mediumRiskGpa", "Medium-risk GPA", 0, 4],
    ["minimumGpa", "Minimum GPA", 0, 4],
    ["highRiskAttendance", "High-risk attendance", 0, 100],
    ["mediumRiskAttendance", "Medium-risk attendance", 0, 100],
    ["minimumAttendance", "Minimum attendance", 0, 100],
  ];
  const next = { ...values };
  for (const [key, label, min, max] of fields) {
    const number = Number(values[key]);
    if (!Number.isFinite(number) || number < min || number > max) {
      errors[key] = `${label} must be from ${min} to ${max}.`;
    } else {
      next[key] = key.toLowerCase().includes("gpa")
        ? Math.round(number * 100) / 100
        : Math.round(number);
    }
  }
  if (!errors.highRiskGpa && !errors.mediumRiskGpa && next.highRiskGpa >= next.mediumRiskGpa) {
    errors.mediumRiskGpa = "Medium-risk GPA must be higher than the high-risk GPA.";
  }
  if (
    !errors.highRiskAttendance &&
    !errors.mediumRiskAttendance &&
    next.highRiskAttendance >= next.mediumRiskAttendance
  ) {
    errors.mediumRiskAttendance =
      "Medium-risk attendance must be higher than the high-risk attendance.";
  }
  if (Object.keys(errors).length > 0) return { errors, value: null };
  return { errors, value: next };
}

export function validateSystem(
  values: SystemPreferences,
): { errors: FieldErrors; value: SystemPreferences | null } {
  const errors: FieldErrors = {};
  const institutionName = clean(values.institutionName);
  const academicYear = clean(values.academicYear);
  const currentSemester = clean(values.currentSemester);
  if (institutionName.length < 2 || institutionName.length > 80) {
    errors.institutionName = "Enter the institution name.";
  }
  const year = /^(\d{4})-(\d{4})$/.exec(academicYear);
  if (!year || Number(year[2]) !== Number(year[1]) + 1) {
    errors.academicYear = "Use a year range such as 2025-2026.";
  }
  if (currentSemester.length < 2 || currentSemester.length > 40) {
    errors.currentSemester = "Enter the current semester label.";
  }
  if (!PAGE_SIZE_OPTIONS.includes(values.pageSize as (typeof PAGE_SIZE_OPTIONS)[number])) {
    errors.pageSize = "Choose 8, 12, or 20 rows.";
  }
  if (Object.keys(errors).length > 0) return { errors, value: null };
  return {
    errors,
    value: {
      institutionName,
      academicYear,
      currentSemester,
      pageSize: values.pageSize,
    },
  };
}

export function isRecordInput(value: AcademicRecordInput | null): value is AcademicRecordInput {
  return value !== null;
}
