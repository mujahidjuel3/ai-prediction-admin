"use client";

import { useEffect, useRef } from "react";
import {
  disconnectNotificationSocket,
  getNotificationSocket,
  NOTIFICATION_NEW_EVENT,
  type NotificationNewEvent,
} from "@/lib/notification-socket";
import { apiRequest } from "@/lib/api";

export function useNotificationSocket(options: {
  enabled: boolean;
  onEvent?: (event: NotificationNewEvent) => void;
  onReconnectSync?: () => void;
}) {
  const onEventRef = useRef(options.onEvent);
  const onReconnectSyncRef = useRef(options.onReconnectSync);
  onEventRef.current = options.onEvent;
  onReconnectSyncRef.current = options.onReconnectSync;

  useEffect(() => {
    if (!options.enabled) {
      disconnectNotificationSocket();
      return;
    }

    let cancelled = false;
    let socket;
    try {
      socket = getNotificationSocket();
    } catch {
      return;
    }

    const onNew = (payload: NotificationNewEvent) => {
      if (!cancelled) onEventRef.current?.(payload);
    };

    const syncMissed = () => {
      if (!cancelled) onReconnectSyncRef.current?.();
    };

    socket.on(NOTIFICATION_NEW_EVENT, onNew);
    socket.on("connect", syncMissed);
    if (!socket.connected) socket.connect();
    else syncMissed();

    return () => {
      cancelled = true;
      socket.off(NOTIFICATION_NEW_EVENT, onNew);
      socket.off("connect", syncMissed);
    };
  }, [options.enabled]);
}

/** Optional REST probe used by tests/docs to prove fallback remains available. */
export async function fetchNotificationsFallback() {
  return apiRequest<Array<{ id: string }>>("/notifications?page=1&pageSize=25");
}
