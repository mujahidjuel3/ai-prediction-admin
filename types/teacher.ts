export type TeacherStatus = "active" | "inactive";

export interface Teacher {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  status: TeacherStatus;
}

export interface TeacherInput {
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  status: TeacherStatus;
}
