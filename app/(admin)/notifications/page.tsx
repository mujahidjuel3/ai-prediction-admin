import { NotificationsView } from "@/components/notifications/notifications-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return <NotificationsView />;
}
