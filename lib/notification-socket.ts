import { io, type Socket } from "socket.io-client";
import { socketOrigin } from "@/lib/socket-url";

export const NOTIFICATION_NEW_EVENT = "notification:new";

export interface NotificationNewEvent {
  id: string;
  type: "manual" | "alert_linked";
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
}

let shared: Socket | null = null;

/** Authenticated Socket.IO client. Cookies (access_token) are sent with credentials; never put tokens in the URL. */
export function getNotificationSocket(): Socket {
  if (shared) return shared;
  shared = io(`${socketOrigin()}/notifications`, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 1000,
  });
  return shared;
}

export function disconnectNotificationSocket() {
  if (!shared) return;
  shared.removeAllListeners();
  shared.disconnect();
  shared = null;
}
