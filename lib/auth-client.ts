import { apiPost, apiRequest, invalidateCsrfToken } from "@/lib/api";
import { disconnectNotificationSocket } from "@/lib/notification-socket";

export async function signIn(email: string, password: string) {
  await apiRequest<{ user: { id: string } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  invalidateCsrfToken();
}

export async function signOut() {
  try {
    disconnectNotificationSocket();
    await apiPost<{ loggedOut: boolean }>("/auth/logout", {});
  } catch {
    // Session cookies may already have expired; the signed-out route still completes locally.
  } finally {
    invalidateCsrfToken();
  }
}
