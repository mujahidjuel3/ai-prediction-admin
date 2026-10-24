import type { RiskLevel } from "@/types/common";

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  severity: RiskLevel;
  createdAt: string;
  read: boolean;
  studentId: string | null;
  alertId: string | null;
}
