import { cookies } from "next/headers";
import { apiGetServer } from "@/lib/api";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const cookie = jar.getAll().map(({ name, value }) => `${name}=${value}`).join("; ");
  try {
    const response = await apiGetServer<SessionUser>("/auth/me", cookie);
    return response.data;
  } catch {
    return null;
  }
}
