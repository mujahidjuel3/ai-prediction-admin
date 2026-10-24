export interface AdminProfile {
  name: string;
  email: string;
  title: string;
  office: string;
}

export interface NotificationPreferences {
  highRiskAlerts: boolean;
  attendanceAlerts: boolean;
  weeklySummary: boolean;
}

export interface AcademicThresholds {
  highRiskGpa: number;
  highRiskAttendance: number;
  mediumRiskGpa: number;
  mediumRiskAttendance: number;
  minimumGpa: number;
  minimumAttendance: number;
}

export interface SystemPreferences {
  institutionName: string;
  academicYear: string;
  currentSemester: string;
  pageSize: number;
}

export interface SystemSettings {
  profile: AdminProfile;
  notifications: NotificationPreferences;
  thresholds: AcademicThresholds;
  system: SystemPreferences;
}
