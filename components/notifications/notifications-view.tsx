"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoNotice } from "@/components/ui/demo-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { SeverityBadge } from "@/components/ui/status-badges";
import { notificationVisible } from "@/lib/selectors";
import { markAllNotificationsRead, markNotificationRead, useAdminState } from "@/lib/store";
import { cn, formatDate } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

export function NotificationsView() {
  const state = useAdminState();
  const [filter, setFilter] = useState("all");
  const notifications = [...state.notifications]
    .filter((notification) => notificationVisible(state, notification))
    .filter((notification) => {
      if (filter === "unread") return !notification.read;
      if (filter === "read") return notification.read;
      return true;
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const unread = state.notifications.filter((notification) => !notification.read).length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notifications"
        description="Demonstration notices for this session. They are not email, push, or live events."
        actions={
          <Button variant="outline" onClick={() => markAllNotificationsRead()} disabled={unread === 0}>
            Mark all as read
          </Button>
        }
      />
      <DemoNotice>
        Marking a notice as read changes this browser session only. Socket or mail delivery is not connected.
      </DemoNotice>
      <Card className="p-4">
        <div className="max-w-xs">
          <Select
            id="notification-filter"
            label="Status"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            options={[
              { label: "All notices", value: "all" },
              { label: "Unread", value: "unread" },
              { label: "Read", value: "read" },
            ]}
          />
        </div>
      </Card>
      <Card>
        {notifications.length === 0 ? (
          <EmptyState title="No notices" description="Unread and read demonstration notices will appear here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <li key={notification.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge level={notification.severity} />
                    <span className={cn("text-xs", notification.read ? "text-slate-400" : "font-medium text-primary")}>
                      {notification.read ? "Read" : "Unread"}
                    </span>
                    <span className="text-xs text-slate-400">{formatDate(notification.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-900">{notification.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    {notification.studentId ? (
                      <Link href={`/students/${notification.studentId}`} className="font-medium text-primary">
                        View student
                      </Link>
                    ) : null}
                    {notification.alertId ? (
                      <Link href="/alerts" className="font-medium text-primary">
                        View alerts
                      </Link>
                    ) : null}
                  </div>
                </div>
                {notification.read ? null : (
                  <Button variant="outline" size="sm" onClick={() => markNotificationRead(notification.id)}>
                    Mark as read
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
