import { SEMESTERS } from "@/lib/constants";
import type { AlertCategory } from "@/types/alert";
import type { FactorLevel, RiskLevel, SortDirection } from "@/types/common";
import type { UserRole } from "@/types/user";

export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

export function formatGpa(value: number): string {
  return value.toFixed(2);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatScore(value: number | null): string {
  return value === null ? "No records" : `${Math.round(value)}`;
}

export function formatConfidence(value: number | null): string {
  return value === null ? "Not available" : `${Math.round(value)}%`;
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function riskLabel(level: RiskLevel): string {
  if (level === "high") return "High risk";
  if (level === "medium") return "Medium risk";
  return "Low risk";
}

export function severityLabel(level: RiskLevel): string {
  if (level === "high") return "High";
  if (level === "medium") return "Medium";
  return "Low";
}

export function factorLabel(level: FactorLevel): string {
  if (level === "good") return "Good";
  if (level === "moderate") return "Moderate";
  return "Low";
}

export function alertCategoryLabel(category: AlertCategory | string): string {
  const labels: Record<string, string> = {
    attendance: "Attendance",
    assessment: "Assessment",
    gpa: "GPA",
    assignment: "Assignment",
    engagement: "Engagement",
  };
  return labels[category] ?? category;
}

export function statusLabel(status: string): string {
  if (status === "acknowledged") return "Acknowledged";
  if (status === "resolved") return "Resolved";
  if (status === "inactive") return "Inactive";
  if (status === "on-leave") return "On leave";
  if (status === "enrolled") return "Enrolled";
  if (status === "active") return "Active";
  return "Open";
}

export function roleLabel(role: UserRole): string {
  if (role === "administrator") return "Administrator";
  if (role === "advisor") return "Advisor";
  if (role === "registrar") return "Registrar";
  return "Teacher";
}

export function compareValues(
  left: string | number,
  right: string | number,
  direction: SortDirection,
): number {
  const result =
    typeof left === "number" && typeof right === "number"
      ? left - right
      : String(left).localeCompare(String(right), undefined, {
          numeric: true,
          sensitivity: "base",
        });
  return direction === "asc" ? result : -result;
}

export function nextId(prefix: string, ids: string[]): string {
  const max = ids.reduce((highest, id) => {
    const match = /(\d+)$/.exec(id);
    return Math.max(highest, match ? Number(match[1]) : 0);
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

export function readParam(
  value: string | string[] | undefined,
  fallback = "all",
): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

export function selectedOrAll(value: string, allowed: string[]): string {
  return value !== "all" && !allowed.includes(value) ? "all" : value;
}

export function includesQuery(query: string, values: Array<string | number>): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return values.some((value) => String(value).toLowerCase().includes(needle));
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function semesterOptions(includeAll = false) {
  const options = SEMESTERS.map((semester) => ({
    label: `Semester ${semester}`,
    value: String(semester),
  }));
  return includeAll ? [{ label: "All semesters", value: "all" }, ...options] : options;
}

export const RISK_OPTIONS = [
  { label: "All risk levels", value: "all" },
  { label: "High risk", value: "high" },
  { label: "Medium risk", value: "medium" },
  { label: "Low risk", value: "low" },
] as const;
