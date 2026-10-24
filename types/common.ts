export type RiskLevel = "low" | "medium" | "high";

export type AlertStatus = "open" | "acknowledged" | "resolved";

export type FactorLevel = "low" | "moderate" | "good";

export type SortDirection = "asc" | "desc";

export interface MonthlyMetric {
  month: string;
  gpa: number;
  attendance: number;
  assessment: number;
}

export interface ContributingFactor {
  name: string;
  level: FactorLevel;
}

export type FieldErrors = Record<string, string>;
