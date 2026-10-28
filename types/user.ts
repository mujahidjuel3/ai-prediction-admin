export type UserRole = "administrator" | "advisor" | "teacher" | "registrar";

export type UserStatus = "active" | "inactive";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface UserInput {
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export type AccountProvisioningMode = "CREATE" | "LINK";

export interface LinkableAccount {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "TEACHER";
  status: "ACTIVE";
}
