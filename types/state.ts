import type { AcademicRecord } from "@/types/academic-record";
import type { Alert } from "@/types/alert";
import type { Course } from "@/types/course";
import type { Department } from "@/types/department";
import type { AdminNotification } from "@/types/notification";
import type { Prediction } from "@/types/prediction";
import type { SystemSettings } from "@/types/settings";
import type { Student } from "@/types/student";
import type { Teacher } from "@/types/teacher";
import type { AdminUser } from "@/types/user";

export interface AdminState {
  departments: Department[];
  teachers: Teacher[];
  students: Student[];
  courses: Course[];
  records: AcademicRecord[];
  predictions: Prediction[];
  alerts: Alert[];
  notifications: AdminNotification[];
  users: AdminUser[];
  settings: SystemSettings;
}
