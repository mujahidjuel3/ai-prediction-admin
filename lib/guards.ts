import { CURRENT_ADMIN_ID } from "@/lib/constants";
import type { AdminState } from "@/types/state";

export function teacherRemovalMessage(state: AdminState, teacherId: string): string | null {
  const isHead = state.departments.some((department) => department.headTeacherId === teacherId);
  const assigned = state.courses.some((course) => course.teacherId === teacherId);
  if (isHead && assigned) {
    return "This teacher is a head of department and is assigned to courses. Reassign both before deleting the profile.";
  }
  if (isHead) {
    return "This teacher is a head of department. Choose another head before deleting the profile.";
  }
  if (assigned) {
    return "This teacher is assigned to one or more courses. Reassign those courses before deleting the profile.";
  }
  return null;
}

export function departmentRemovalMessage(
  state: AdminState,
  departmentId: string,
): string | null {
  const teachers = state.teachers.some((teacher) => teacher.departmentId === departmentId);
  const students = state.students.some((student) => student.departmentId === departmentId);
  const courses = state.courses.some((course) => course.departmentId === departmentId);
  if (!teachers && !students && !courses) return null;
  return "Move or delete the teachers, students, and courses in this department before deleting it.";
}

export function userRemovalMessage(userId: string): string | null {
  if (userId === CURRENT_ADMIN_ID) {
    return "The signed-in demonstration administrator cannot be deleted.";
  }
  return null;
}
