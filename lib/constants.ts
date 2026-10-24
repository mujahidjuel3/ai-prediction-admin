import type { CSSProperties } from "react";
import type { AcademicThresholds } from "@/types/settings";
import type { UserRole } from "@/types/user";

export const APP_NAME = "Academic Sentinel";
export const APP_TAGLINE = "Administration";
export const CURRENT_ADMIN_ID = "u-001";
export const MAX_IMPORT_ROWS = 200;

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export const PAGE_SIZE_OPTIONS = [8, 12, 20] as const;

export const USER_ROLES: UserRole[] = [
  "administrator",
  "advisor",
  "teacher",
  "registrar",
];

export const DEFAULT_THRESHOLDS: AcademicThresholds = {
  highRiskGpa: 2.5,
  highRiskAttendance: 60,
  mediumRiskGpa: 3,
  mediumRiskAttendance: 75,
  minimumGpa: 2.5,
  minimumAttendance: 75,
};

export const CHART_TOOLTIP_STYLE: CSSProperties = {
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  fontSize: 12,
};

export const CHART_TICK = { fill: "#64748b", fontSize: 12 };

export const CHART_GRID = "#e2e8f0";
