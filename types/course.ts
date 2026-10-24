export interface Course {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  semester: number;
  teacherId: string | null;
  credits: number;
}

export interface CourseInput {
  name: string;
  code: string;
  departmentId: string;
  semester: number;
  teacherId: string | null;
  credits: number;
}
