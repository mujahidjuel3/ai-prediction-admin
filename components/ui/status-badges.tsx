import { Badge } from "@/components/ui/badge";
import { factorLabel, riskLabel, severityLabel, statusLabel } from "@/lib/utils";
import type { AlertStatus, FactorLevel, RiskLevel } from "@/types/common";

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <Badge variant={level}>{riskLabel(level)}</Badge>;
}

export function SeverityBadge({ level }: { level: RiskLevel }) {
  return <Badge variant={level}>{severityLabel(level)}</Badge>;
}

export function StatusBadge({ status }: { status: AlertStatus }) {
  const variant =
    status === "resolved" ? "success" : status === "acknowledged" ? "info" : "warning";
  return <Badge variant={variant}>{statusLabel(status)}</Badge>;
}

export function FactorBadge({ level }: { level: FactorLevel }) {
  const variant = level === "good" ? "success" : level === "moderate" ? "warning" : "danger";
  return <Badge variant={variant}>{factorLabel(level)}</Badge>;
}

export function ActiveBadge({ status }: { status: "active" | "inactive" | "enrolled" | "on-leave" }) {
  const variant = status === "active" || status === "enrolled" ? "success" : "neutral";
  return <Badge variant={variant}>{statusLabel(status)}</Badge>;
}
