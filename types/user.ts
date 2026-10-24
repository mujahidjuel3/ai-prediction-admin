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
