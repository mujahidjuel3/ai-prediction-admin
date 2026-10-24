export interface RiskDistributionPoint {
  level: "low" | "medium" | "high";
  count: number;
}

export interface DepartmentRiskPoint {
  code: string;
  department: string;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  students: number;
  averageGpa: number | null;
}

export interface BucketPoint {
  range: string;
  count: number;
}

export interface CoursePerformancePoint {
  code: string;
  course: string;
  averageScore: number | null;
  highRiskPercent: number | null;
  students: number;
}
