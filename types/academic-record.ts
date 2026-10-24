export interface AcademicRecord {
  id: string;
  studentId: string;
  courseId: string;
  attendance: number;
  assignment: number;
  quiz: number;
  midterm: number;
  finalMark: number;
  semester: number;
}

export interface AcademicRecordInput {
  studentId: string;
  courseId: string;
  attendance: number;
  assignment: number;
  quiz: number;
  midterm: number;
  finalMark: number;
  semester: number;
}
