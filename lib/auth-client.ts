import { apiPost, apiRequest, invalidateCsrfToken } from "@/lib/api";

export async function signIn(email: string, password: string) {
  await apiRequest<{ user: { id: string } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  invalidateCsrfToken();
}

export async function signOut() {
  try {
    await apiPost<{ loggedOut: boolean }>("/auth/logout", {});
  } catch {
    // Session cookies may already have expired; the signed-out route still completes locally.
  } finally {
    invalidateCsrfToken();
  }
}
