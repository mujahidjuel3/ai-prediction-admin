"use client";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useNotificationSocket } from "@/hooks/use-notification-socket";
import { apiGet } from "@/lib/api";
import { disconnectNotificationSocket } from "@/lib/notification-socket";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState(pathname);
  const [unread, setUnread] = useState(0);
  const [inboxTick, setInboxTick] = useState(0);

  if (path !== pathname) {
    setPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    let active = true;
    void apiGet<unknown[]>("/notifications?unread=true&page=1&pageSize=1")
      .then((result) => {
        if (active) setUnread(result.meta?.total ?? result.data.length);
      })
      .catch(() => {
        if (active) setUnread(0);
      });
    return () => {
      active = false;
    };
  }, [pathname, inboxTick]);

  useNotificationSocket({
    enabled: true,
    onEvent: (event) => {
      if (!event.readAt) setUnread((value) => value + 1);
      setInboxTick((value) => value + 1);
    },
    onReconnectSync: () => setInboxTick((value) => value + 1),
  });

  useEffect(() => () => {
    disconnectNotificationSocket();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to content
      </a>
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="min-w-0 lg:pl-64">
        <Header open={open} onMenuClick={() => setOpen(true)} unreadOverride={unread} />
        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 px-4 py-5 outline-none xs:px-5 md:px-6 lg:px-8 lg:py-6"
        >
          <div className="mx-auto min-w-0 max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
