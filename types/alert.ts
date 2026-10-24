import type { AlertStatus, RiskLevel } from "@/types/common";

export type AlertCategory =
  | "attendance"
  | "assessment"
  | "gpa"
  | "assignment"
  | "engagement";

export interface Alert {
  id: string;
  studentId: string;
  category: AlertCategory;
  severity: RiskLevel;
  reason: string;
  createdAt: string;
  status: AlertStatus;
  recommendedAction: string;
}

export interface AlertSummary {
  total: number;
  highPriority: number;
  mediumPriority: number;
  resolved: number;
}
