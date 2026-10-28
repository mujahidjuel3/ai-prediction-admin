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

export interface TeacherProfileProvisioningFields {
  employeeNumber: string;
  name: string;
  departmentId: string;
}

export type TeacherAccountProvisioning =
  | { accountMode: "CREATE"; email: string; initialPassword: string }
  | { accountMode: "LINK"; userId: string };

export type CreateTeacherProfileRequest = TeacherProfileProvisioningFields & TeacherAccountProvisioning;
