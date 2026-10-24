import { deriveFactors, deriveRisk } from "@/lib/academics";
import { DEFAULT_THRESHOLDS } from "@/lib/constants";
import type { AcademicRecord } from "@/types/academic-record";
import type { Alert } from "@/types/alert";
import type { Course } from "@/types/course";
import type { Department } from "@/types/department";
import type { AdminNotification } from "@/types/notification";
import type { Prediction } from "@/types/prediction";
import type { SystemSettings } from "@/types/settings";
import type { Student, StudentInput } from "@/types/student";
import type { AdminState } from "@/types/state";
import type { Teacher } from "@/types/teacher";
import type { AdminUser } from "@/types/user";

interface StudentSeed extends StudentInput {
  id: string;
  lastUpdated: string;
  confidence: number | null;
  predictionDate: string;
  summary: string;
  recommendation: string;
}

const departments: Department[] = [
  { id: "dep-cse", name: "Computer Science & Engineering", code: "CSE", headTeacherId: "t-001" },
  { id: "dep-eee", name: "Electrical & Electronic Engineering", code: "EEE", headTeacherId: "t-003" },
  { id: "dep-bba", name: "Business Administration", code: "BBA", headTeacherId: "t-005" },
  { id: "dep-ce", name: "Civil Engineering", code: "CE", headTeacherId: "t-006" },
  { id: "dep-eng", name: "English", code: "ENG", headTeacherId: "t-007" },
  { id: "dep-math", name: "Mathematics", code: "MATH", headTeacherId: "t-008" },
];

const teachers: Teacher[] = [
  { id: "t-001", employeeId: "EMP-1041", name: "Dr. Nadia Karim", email: "nadia.karim@northbridge.edu", phone: "01710-110041", departmentId: "dep-cse", status: "active" },
  { id: "t-002", employeeId: "EMP-1088", name: "Rezaul Islam", email: "rezaul.islam@northbridge.edu", phone: "01710-110088", departmentId: "dep-cse", status: "active" },
  { id: "t-003", employeeId: "EMP-2033", name: "Dr. Kamal Hossain", email: "kamal.hossain@northbridge.edu", phone: "01710-120033", departmentId: "dep-eee", status: "active" },
  { id: "t-004", employeeId: "EMP-2074", name: "Shaila Akter", email: "shaila.akter@northbridge.edu", phone: "01710-120074", departmentId: "dep-eee", status: "active" },
  { id: "t-005", employeeId: "EMP-3012", name: "Prof. Laila Sultana", email: "laila.sultana@northbridge.edu", phone: "01710-130012", departmentId: "dep-bba", status: "active" },
  { id: "t-006", employeeId: "EMP-4040", name: "Dr. Imran Kabir", email: "imran.kabir@northbridge.edu", phone: "01710-140040", departmentId: "dep-ce", status: "active" },
  { id: "t-007", employeeId: "EMP-5018", name: "Dr. Farhana Begum", email: "farhana.begum@northbridge.edu", phone: "01710-150018", departmentId: "dep-eng", status: "active" },
  { id: "t-008", employeeId: "EMP-6022", name: "Dr. Yusuf Ali", email: "yusuf.ali@northbridge.edu", phone: "01710-160022", departmentId: "dep-math", status: "active" },
  { id: "t-009", employeeId: "EMP-1110", name: "Mahmud Hasan", email: "mahmud.hasan@northbridge.edu", phone: "01710-110110", departmentId: "dep-cse", status: "inactive" },
];

const courses: Course[] = [
  { id: "cse-310", name: "Data Structures", code: "CSE 310", departmentId: "dep-cse", semester: 6, teacherId: "t-001", credits: 3 },
  { id: "cse-221", name: "Database Systems", code: "CSE 221", departmentId: "dep-cse", semester: 6, teacherId: "t-002", credits: 3 },
  { id: "cse-412", name: "Machine Learning", code: "CSE 412", departmentId: "dep-cse", semester: 7, teacherId: "t-001", credits: 3 },
  { id: "cse-101", name: "Programming Fundamentals", code: "CSE 101", departmentId: "dep-cse", semester: 1, teacherId: "t-002", credits: 3 },
  { id: "eee-201", name: "Circuit Theory", code: "EEE 201", departmentId: "dep-eee", semester: 4, teacherId: "t-003", credits: 3 },
  { id: "eee-310", name: "Power Systems", code: "EEE 310", departmentId: "dep-eee", semester: 6, teacherId: "t-004", credits: 3 },
  { id: "bba-305", name: "Financial Accounting", code: "BBA 305", departmentId: "dep-bba", semester: 8, teacherId: "t-005", credits: 3 },
  { id: "bba-210", name: "Organizational Behavior", code: "BBA 210", departmentId: "dep-bba", semester: 4, teacherId: "t-005", credits: 3 },
  { id: "ce-401", name: "Structural Analysis", code: "CE 401", departmentId: "dep-ce", semester: 8, teacherId: "t-006", credits: 4 },
  { id: "eng-110", name: "Academic Writing", code: "ENG 110", departmentId: "dep-eng", semester: 2, teacherId: "t-007", credits: 3 },
  { id: "math-201", name: "Linear Algebra", code: "MATH 201", departmentId: "dep-math", semester: 4, teacherId: "t-008", credits: 3 },
  { id: "math-301", name: "Probability & Statistics", code: "MATH 301", departmentId: "dep-math", semester: 5, teacherId: "t-008", credits: 3 },
];

const studentSeeds: StudentSeed[] = [
  { id: "st-001", studentId: "CSE-2022-014", name: "Rahim Ahmed", email: "rahim.ahmed@student.northbridge.edu", phone: "01710-220014", departmentId: "dep-cse", semester: 6, enrollmentYear: 2022, enrollmentStatus: "enrolled", gpa: 2.14, attendance: 58, assignmentAverage: 47, quizAverage: 51, midtermScore: 42, lastUpdated: "2026-08-14", confidence: 87, predictionDate: "2026-08-14", summary: "Sample result: attendance and midterm scores place Rahim in the high-risk band for the current term.", recommendation: "Schedule an advising meeting this week and arrange tutoring for Data Structures and Machine Learning." },
  { id: "st-002", studentId: "BBA-2021-088", name: "Fatima Khan", email: "fatima.khan@student.northbridge.edu", phone: "01711-210088", departmentId: "dep-bba", semester: 8, enrollmentYear: 2021, enrollmentStatus: "enrolled", gpa: 3.72, attendance: 92, assignmentAverage: 91, quizAverage: 88, midtermScore: 90, lastUpdated: "2026-08-15", confidence: 91, predictionDate: "2026-08-15", summary: "Sample result: consistent attendance and assessment scores place Fatima in the low-risk band.", recommendation: "No intervention is indicated. A final-semester teaching-assistant option can be discussed at the next routine meeting." },
  { id: "st-003", studentId: "EEE-2023-021", name: "Tanvir Hasan", email: "tanvir.hasan@student.northbridge.edu", phone: "01712-230021", departmentId: "dep-eee", semester: 4, enrollmentYear: 2023, enrollmentStatus: "enrolled", gpa: 2.56, attendance: 67, assignmentAverage: 61, quizAverage: 64, midtermScore: 58, lastUpdated: "2026-08-13", confidence: 74, predictionDate: "2026-08-13", summary: "Sample result: attendance and the midterm result place Tanvir in the medium-risk band.", recommendation: "Ask the student to raise attendance above the demonstration threshold and attend the circuit-theory revision session." },
  { id: "st-004", studentId: "ENG-2022-055", name: "Nusrat Jahan", email: "nusrat.jahan@student.northbridge.edu", phone: "01713-220055", departmentId: "dep-eng", semester: 6, enrollmentYear: 2022, enrollmentStatus: "enrolled", gpa: 3.41, attendance: 88, assignmentAverage: 85, quizAverage: 82, midtermScore: 84, lastUpdated: "2026-08-12", confidence: 82, predictionDate: "2026-08-12", summary: "Sample result: stable attendance and assessment scores place Nusrat in the low-risk band.", recommendation: "Continue routine monitoring and mention the departmental writing workshop at the next meeting." },
  { id: "st-005", studentId: "CSE-2023-102", name: "Arif Chowdhury", email: "arif.chowdhury@student.northbridge.edu", phone: "01714-230102", departmentId: "dep-cse", semester: 4, enrollmentYear: 2023, enrollmentStatus: "enrolled", gpa: 1.98, attendance: 49, assignmentAverage: 38, quizAverage: 44, midtermScore: 36, lastUpdated: "2026-08-16", confidence: 90, predictionDate: "2026-08-16", summary: "Sample result: low attendance and failed-range assessments place Arif in the high-risk band.", recommendation: "Refer Arif to the department academic committee and set a written recovery plan for missed labs and assignments." },
  { id: "st-006", studentId: "CE-2021-033", name: "Sadia Rahman", email: "sadia.rahman@student.northbridge.edu", phone: "01715-210033", departmentId: "dep-ce", semester: 8, enrollmentYear: 2021, enrollmentStatus: "enrolled", gpa: 3.18, attendance: 81, assignmentAverage: 78, quizAverage: 76, midtermScore: 80, lastUpdated: "2026-08-11", confidence: 80, predictionDate: "2026-08-11", summary: "Sample result: steady coursework places Sadia in the low-risk band.", recommendation: "No immediate intervention. Review the final-year project timeline at the routine checkpoint." },
  { id: "st-007", studentId: "MATH-2024-009", name: "Mehedi Hasan", email: "mehedi.hasan@student.northbridge.edu", phone: "01716-240009", departmentId: "dep-math", semester: 2, enrollmentYear: 2024, enrollmentStatus: "enrolled", gpa: 2.62, attendance: 70, assignmentAverage: 62, quizAverage: 64, midtermScore: 60, lastUpdated: "2026-08-10", confidence: 71, predictionDate: "2026-08-10", summary: "Sample result: early assessment scores and attendance place Mehedi in the medium-risk band.", recommendation: "Offer the linear-algebra workshop and check assignment submission before the next quiz." },
  { id: "st-008", studentId: "CSE-2022-077", name: "Anika Sultana", email: "anika.sultana@student.northbridge.edu", phone: "01717-220077", departmentId: "dep-cse", semester: 6, enrollmentYear: 2022, enrollmentStatus: "enrolled", gpa: 3.55, attendance: 90, assignmentAverage: 87, quizAverage: 86, midtermScore: 88, lastUpdated: "2026-08-09", confidence: 86, predictionDate: "2026-08-09", summary: "Sample result: strong attendance and assessment scores place Anika in the low-risk band.", recommendation: "No intervention is indicated. Anika can be considered for a peer-tutoring role." },
  { id: "st-009", studentId: "EEE-2022-044", name: "Rafiq Islam", email: "rafiq.islam@student.northbridge.edu", phone: "01718-220044", departmentId: "dep-eee", semester: 6, enrollmentYear: 2022, enrollmentStatus: "enrolled", gpa: 2.22, attendance: 54, assignmentAverage: 49, quizAverage: 46, midtermScore: 44, lastUpdated: "2026-08-14", confidence: 84, predictionDate: "2026-08-14", summary: "Sample result: attendance below 60% and weak assessment scores place Rafiq in the high-risk band.", recommendation: "Meet Rafiq this week and require a catch-up plan for Power Systems laboratories." },
  { id: "st-010", studentId: "BBA-2023-019", name: "Mitu Akter", email: "mitu.akter@student.northbridge.edu", phone: "01719-230019", departmentId: "dep-bba", semester: 4, enrollmentYear: 2023, enrollmentStatus: "enrolled", gpa: 2.88, attendance: 74, assignmentAverage: 70, quizAverage: 68, midtermScore: 66, lastUpdated: "2026-08-08", confidence: 69, predictionDate: "2026-08-08", summary: "Sample result: results sit near the medium-risk demonstration thresholds.", recommendation: "Monitor assignment submission and attendance through the next progress review." },
  { id: "st-011", studentId: "CE-2023-061", name: "Hasan Mahmud", email: "hasan.mahmud@student.northbridge.edu", phone: "01720-230061", departmentId: "dep-ce", semester: 4, enrollmentYear: 2023, enrollmentStatus: "enrolled", gpa: 2.09, attendance: 57, assignmentAverage: 48, quizAverage: 51, midtermScore: 45, lastUpdated: "2026-08-15", confidence: 83, predictionDate: "2026-08-15", summary: "Sample result: low attendance and midterm performance place Hasan in the high-risk band.", recommendation: "Arrange a civil-engineering advising meeting and a supervised problem-solving session before the next quiz." },
  { id: "st-012", studentId: "ENG-2024-012", name: "Priya Das", email: "priya.das@student.northbridge.edu", phone: "01721-240012", departmentId: "dep-eng", semester: 2, enrollmentYear: 2024, enrollmentStatus: "enrolled", gpa: 3.62, attendance: 94, assignmentAverage: 90, quizAverage: 89, midtermScore: 91, lastUpdated: "2026-08-07", confidence: 89, predictionDate: "2026-08-07", summary: "Sample result: high attendance and assessment scores place Priya in the low-risk band.", recommendation: "No intervention is indicated. Continue routine first-year monitoring." },
  { id: "st-013", studentId: "MATH-2023-028", name: "Omar Faruk", email: "omar.faruk@student.northbridge.edu", phone: "01722-230028", departmentId: "dep-math", semester: 5, enrollmentYear: 2023, enrollmentStatus: "enrolled", gpa: 2.67, attendance: 71, assignmentAverage: 66, quizAverage: 64, midtermScore: 62, lastUpdated: "2026-08-10", confidence: 73, predictionDate: "2026-08-10", summary: "Sample result: coursework is uneven enough to place Omar in the medium-risk band.", recommendation: "Review the probability assignment series with the course teacher before the next checkpoint." },
  { id: "st-014", studentId: "CSE-2024-003", name: "Lamia Noor", email: "lamia.noor@student.northbridge.edu", phone: "01723-240003", departmentId: "dep-cse", semester: 1, enrollmentYear: 2024, enrollmentStatus: "enrolled", gpa: 3.21, attendance: 86, assignmentAverage: 80, quizAverage: 78, midtermScore: 79, lastUpdated: "2026-08-06", confidence: 78, predictionDate: "2026-08-06", summary: "Sample result: first-semester indicators place Lamia in the low-risk band.", recommendation: "No intervention is indicated. Keep Lamia on the standard first-year check-in schedule." },
  { id: "st-015", studentId: "EEE-2021-015", name: "Karim Uddin", email: "karim.uddin@student.northbridge.edu", phone: "01724-210015", departmentId: "dep-eee", semester: 8, enrollmentYear: 2021, enrollmentStatus: "on-leave", gpa: 2.55, attendance: 68, assignmentAverage: 60, quizAverage: 58, midtermScore: 54, lastUpdated: "2026-08-11", confidence: 68, predictionDate: "2026-08-11", summary: "Sample result: the last recorded indicators, together with on-leave status, sit in the medium-risk band. This is not a live prediction.", recommendation: "On return from leave, repeat an advising review before Karim rejoins Power Systems." },
  { id: "st-016", studentId: "BBA-2022-041", name: "Shirin Akter", email: "shirin.akter@student.northbridge.edu", phone: "01725-220041", departmentId: "dep-bba", semester: 6, enrollmentYear: 2022, enrollmentStatus: "enrolled", gpa: 1.86, attendance: 46, assignmentAverage: 40, quizAverage: 42, midtermScore: 38, lastUpdated: "2026-08-16", confidence: 88, predictionDate: "2026-08-16", summary: "Sample result: attendance and assessment scores place Shirin in the high-risk band.", recommendation: "Book an advising meeting and agree a recovery plan for the two business courses." },
];

function academicRecords(): AcademicRecord[] {
  const rows: Array<[string, string, number, number, number, number, number, number]> = [
    ["st-001", "cse-310", 52, 44, 48, 42, 40, 6],
    ["st-001", "cse-221", 61, 51, 54, 46, 45, 6],
    ["st-001", "cse-412", 55, 42, 49, 39, 37, 7],
    ["st-008", "cse-310", 91, 88, 86, 89, 90, 6],
    ["st-008", "cse-221", 89, 86, 85, 87, 88, 6],
    ["st-008", "cse-412", 90, 87, 84, 86, 89, 7],
    ["st-005", "cse-310", 48, 36, 40, 34, 32, 6],
    ["st-005", "cse-221", 51, 40, 44, 38, 35, 6],
    ["st-014", "cse-101", 88, 82, 80, 81, 84, 1],
    ["st-003", "eee-201", 66, 60, 63, 58, 57, 4],
    ["st-003", "math-201", 70, 64, 66, 61, 62, 4],
    ["st-009", "eee-310", 54, 48, 46, 44, 41, 6],
    ["st-015", "eee-310", 68, 60, 58, 54, 56, 6],
    ["st-002", "bba-305", 94, 92, 90, 91, 93, 8],
    ["st-002", "eng-110", 90, 88, 86, 85, 87, 2],
    ["st-016", "bba-305", 48, 42, 40, 38, 36, 8],
    ["st-016", "bba-210", 44, 38, 41, 37, 35, 4],
    ["st-010", "bba-210", 76, 70, 68, 66, 69, 4],
    ["st-006", "ce-401", 84, 80, 78, 81, 82, 8],
    ["st-011", "ce-401", 55, 46, 50, 44, 42, 8],
    ["st-004", "eng-110", 88, 86, 83, 84, 85, 2],
    ["st-012", "eng-110", 95, 91, 90, 92, 93, 2],
    ["st-007", "math-201", 70, 62, 64, 60, 61, 4],
    ["st-013", "math-301", 72, 66, 64, 63, 65, 5],
  ];

  return rows.map((row, index) => ({
    id: `rec-${String(index + 1).padStart(3, "0")}`,
    studentId: row[0],
    courseId: row[1],
    attendance: row[2],
    assignment: row[3],
    quiz: row[4],
    midterm: row[5],
    finalMark: row[6],
    semester: row[7],
  }));
}

const alerts: Alert[] = [
  { id: "al-001", studentId: "st-001", category: "attendance", severity: "high", reason: "Attendance is 58%, below the high-risk demonstration threshold.", createdAt: "2026-08-14", status: "open", recommendedAction: "Contact the student and set a weekly attendance target." },
  { id: "al-002", studentId: "st-005", category: "assessment", severity: "high", reason: "Midterm and assignment scores are in the failed range.", createdAt: "2026-08-16", status: "open", recommendedAction: "Refer the case to the academic committee and issue a recovery plan." },
  { id: "al-003", studentId: "st-009", category: "gpa", severity: "high", reason: "GPA is 2.22 and attendance is 54%.", createdAt: "2026-08-14", status: "open", recommendedAction: "Schedule an advising meeting before the next lab cycle." },
  { id: "al-004", studentId: "st-003", category: "attendance", severity: "medium", reason: "Attendance is 67%, inside the medium-risk band.", createdAt: "2026-08-13", status: "open", recommendedAction: "Remind the student of the 75% monitoring line." },
  { id: "al-005", studentId: "st-010", category: "assignment", severity: "medium", reason: "Assignment average is near the monitoring line.", createdAt: "2026-08-08", status: "acknowledged", recommendedAction: "Ask the course teacher to confirm missing submissions." },
  { id: "al-006", studentId: "st-008", category: "engagement", severity: "low", reason: "Routine engagement check. No concern remains.", createdAt: "2026-08-02", status: "resolved", recommendedAction: "No further action." },
  { id: "al-007", studentId: "st-011", category: "attendance", severity: "high", reason: "Attendance is 57% and the midterm is below 50.", createdAt: "2026-08-15", status: "open", recommendedAction: "Arrange a supervised problem session this week." },
  { id: "al-008", studentId: "st-016", category: "gpa", severity: "high", reason: "GPA is 1.86 with attendance at 46%.", createdAt: "2026-08-16", status: "open", recommendedAction: "Hold an advising meeting and agree a course recovery plan." },
  { id: "al-009", studentId: "st-013", category: "assessment", severity: "medium", reason: "Quiz and midterm scores are uneven.", createdAt: "2026-08-10", status: "acknowledged", recommendedAction: "Review the probability assignment series with the course teacher." },
  { id: "al-010", studentId: "st-006", category: "assignment", severity: "low", reason: "An earlier assignment dip was followed by a stable recovery.", createdAt: "2026-07-28", status: "resolved", recommendedAction: "No further action." },
  { id: "al-011", studentId: "st-015", category: "attendance", severity: "medium", reason: "The student is on leave and the last attendance record is 68%.", createdAt: "2026-08-11", status: "open", recommendedAction: "Repeat an advising review when the student returns." },
  { id: "al-012", studentId: "st-007", category: "assignment", severity: "medium", reason: "Linear algebra assignments are behind the class pace.", createdAt: "2026-08-10", status: "open", recommendedAction: "Offer the workshop before the next quiz." },
  { id: "al-013", studentId: "st-004", category: "engagement", severity: "low", reason: "Routine check completed with no outstanding action.", createdAt: "2026-07-20", status: "resolved", recommendedAction: "No further action." },
];

const notifications: AdminNotification[] = [
  { id: "n-001", title: "High-severity GPA alert", message: "Shirin Akter has an open high-severity GPA alert in the demonstration set.", severity: "high", createdAt: "2026-08-16", read: false, studentId: "st-016", alertId: "al-008" },
  { id: "n-002", title: "High-severity assessment alert", message: "Arif Chowdhury has an open assessment alert awaiting an advising plan.", severity: "high", createdAt: "2026-08-16", read: false, studentId: "st-005", alertId: "al-002" },
  { id: "n-003", title: "High-severity attendance alert", message: "Hasan Mahmud has an open attendance alert for Structural Analysis.", severity: "high", createdAt: "2026-08-15", read: false, studentId: "st-011", alertId: "al-007" },
  { id: "n-004", title: "High-severity attendance alert", message: "Rahim Ahmed has an open attendance alert for the current term.", severity: "high", createdAt: "2026-08-14", read: false, studentId: "st-001", alertId: "al-001" },
  { id: "n-005", title: "Medium-severity attendance alert", message: "Tanvir Hasan remains in the medium-risk attendance band.", severity: "medium", createdAt: "2026-08-13", read: true, studentId: "st-003", alertId: "al-004" },
  { id: "n-006", title: "Leave review", message: "Karim Uddin is on leave. The related attendance alert is still open.", severity: "medium", createdAt: "2026-08-11", read: false, studentId: "st-015", alertId: "al-011" },
  { id: "n-007", title: "Alert resolved", message: "The engagement alert for Anika Sultana is marked resolved.", severity: "low", createdAt: "2026-08-02", read: true, studentId: "st-008", alertId: "al-006" },
  { id: "n-008", title: "Alert resolved", message: "The assignment alert for Sadia Rahman is marked resolved.", severity: "low", createdAt: "2026-07-28", read: true, studentId: "st-006", alertId: "al-010" },
];

const users: AdminUser[] = [
  { id: "u-001", name: "Farzana Chowdhury", email: "farzana.chowdhury@northbridge.edu", role: "administrator", status: "active", createdAt: "2024-11-02" },
  { id: "u-002", name: "Dr. Ayesha Rahman", email: "ayesha.rahman@northbridge.edu", role: "advisor", status: "active", createdAt: "2025-01-15" },
  { id: "u-003", name: "Dr. Nadia Karim", email: "nadia.karim@northbridge.edu", role: "teacher", status: "active", createdAt: "2025-02-01" },
  { id: "u-004", name: "Registrar Desk", email: "registrar@northbridge.edu", role: "registrar", status: "active", createdAt: "2025-03-12" },
  { id: "u-005", name: "Dr. Kamal Hossain", email: "kamal.hossain@northbridge.edu", role: "teacher", status: "active", createdAt: "2025-02-04" },
  { id: "u-006", name: "Mahmud Hasan", email: "mahmud.hasan@northbridge.edu", role: "teacher", status: "inactive", createdAt: "2025-06-20" },
];

const settings: SystemSettings = {
  profile: {
    name: "Farzana Chowdhury",
    email: "farzana.chowdhury@northbridge.edu",
    title: "System administrator",
    office: "Registry, Room 204",
  },
  notifications: {
    highRiskAlerts: true,
    attendanceAlerts: true,
    weeklySummary: false,
  },
  thresholds: { ...DEFAULT_THRESHOLDS },
  system: {
    institutionName: "Northbridge University",
    academicYear: "2025-2026",
    currentSemester: "Summer 2026",
    pageSize: 8,
  },
};

export function buildSeedState(): AdminState {
  const students: Student[] = studentSeeds.map((seed) => ({
    id: seed.id,
    studentId: seed.studentId,
    name: seed.name,
    email: seed.email,
    phone: seed.phone,
    departmentId: seed.departmentId,
    semester: seed.semester,
    enrollmentYear: seed.enrollmentYear,
    enrollmentStatus: seed.enrollmentStatus,
    gpa: seed.gpa,
    attendance: seed.attendance,
    assignmentAverage: seed.assignmentAverage,
    quizAverage: seed.quizAverage,
    midtermScore: seed.midtermScore,
    riskLevel: deriveRisk(seed.gpa, seed.attendance, DEFAULT_THRESHOLDS),
    lastUpdated: seed.lastUpdated,
    predictionConfidence: seed.confidence,
  }));

  const predictions: Prediction[] = studentSeeds.map((seed) => ({
    studentId: seed.id,
    riskLevel: deriveRisk(seed.gpa, seed.attendance, DEFAULT_THRESHOLDS),
    confidence: seed.confidence,
    factors: deriveFactors(seed),
    summary: seed.summary,
    recommendation: seed.recommendation,
    date: seed.predictionDate,
  }));

  return {
    departments,
    teachers,
    students,
    courses,
    records: academicRecords(),
    predictions,
    alerts,
    notifications,
    users,
    settings,
  };
}
