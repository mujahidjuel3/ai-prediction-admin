import type { ContributingFactor, RiskLevel } from "@/types/common";

export interface Prediction {
  studentId: string;
  riskLevel: RiskLevel;
  confidence: number | null;
  factors: ContributingFactor[];
  summary: string;
  recommendation: string;
  date: string;
}

export interface PredictionRow {
  studentId: string;
  publicStudentId: string;
  studentName: string;
  departmentName: string;
  riskLevel: RiskLevel;
  confidence: number | null;
  factors: ContributingFactor[];
  summary: string;
  recommendation: string;
  date: string;
}

export interface ModelPlaceholder {
  label: string;
  value: string;
  note: string;
}
