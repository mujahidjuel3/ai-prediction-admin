"use client";

import {
  defaultRecommendation,
  deriveFactors,
  deriveRisk,
  NEW_PREDICTION_SUMMARY,
} from "@/lib/academics";
import { readSeedState } from "@/lib/api";
import { CURRENT_ADMIN_ID } from "@/lib/constants";
import {
  departmentRemovalMessage,
  teacherRemovalMessage,
  userRemovalMessage,
} from "@/lib/guards";
import { nextId, todayIso } from "@/lib/utils";
import type { AcademicRecordInput } from "@/types/academic-record";
import type { CourseInput } from "@/types/course";
import type { DepartmentInput } from "@/types/department";
import type {
  AcademicThresholds,
  AdminProfile,
  NotificationPreferences,
  SystemPreferences,
} from "@/types/settings";
import type { AdminState } from "@/types/state";
import type { StudentInput } from "@/types/student";
import type { TeacherInput } from "@/types/teacher";
import type { UserInput } from "@/types/user";
import { useSyncExternalStore } from "react";

export type ActionResult = { ok: true } | { ok: false; message: string };

const serverState = readSeedState();
let state = serverState;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function update(recipe: (current: AdminState) => AdminState) {
  state = recipe(state);
  emit();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getClientSnapshot(): AdminState {
  return state;
}

export function getServerSnapshot(): AdminState {
  return serverState;
}

export function useAdminState(): AdminState {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

function ok(): ActionResult {
  return { ok: true };
}

function fail(message: string): ActionResult {
  return { ok: false, message };
}

export function addStudent(input: StudentInput): ActionResult {
  const id = nextId("st", state.students.map((student) => student.id));
  const riskLevel = deriveRisk(input.gpa, input.attendance, state.settings.thresholds);
  const date = todayIso();
  update((current) => ({
    ...current,
    students: [
      ...current.students,
      {
        ...input,
        id,
        riskLevel,
        lastUpdated: date,
        predictionConfidence: null,
      },
    ],
    predictions: [
      ...current.predictions,
      {
        studentId: id,
        riskLevel,
        confidence: null,
        factors: deriveFactors(input),
        summary: NEW_PREDICTION_SUMMARY,
        recommendation: defaultRecommendation(riskLevel),
        date,
      },
    ],
  }));
  return ok();
}

export function updateStudent(id: string, input: StudentInput): ActionResult {
  const existing = state.students.find((student) => student.id === id);
  if (!existing) return fail("That student is no longer in this session.");
  const riskLevel = deriveRisk(input.gpa, input.attendance, state.settings.thresholds);
  const nextStudent = {
    ...existing,
    ...input,
    riskLevel,
    lastUpdated: todayIso(),
  };
  update((current) => ({
    ...current,
    students: current.students.map((student) => (student.id === id ? nextStudent : student)),
    predictions: current.predictions.map((prediction) =>
      prediction.studentId === id
        ? { ...prediction, riskLevel, factors: deriveFactors(nextStudent) }
        : prediction,
    ),
  }));
  return ok();
}

export function deleteStudent(id: string): ActionResult {
  update((current) => ({
    ...current,
    students: current.students.filter((student) => student.id !== id),
    records: current.records.filter((record) => record.studentId !== id),
    predictions: current.predictions.filter((prediction) => prediction.studentId !== id),
    alerts: current.alerts.filter((alert) => alert.studentId !== id),
    notifications: current.notifications.map((notification) =>
      notification.studentId === id
        ? { ...notification, studentId: null, alertId: null }
        : notification,
    ),
  }));
  return ok();
}

export function addTeacher(input: TeacherInput): ActionResult {
  const id = nextId("t", state.teachers.map((teacher) => teacher.id));
  update((current) => ({ ...current, teachers: [...current.teachers, { ...input, id }] }));
  return ok();
}

export function updateTeacher(id: string, input: TeacherInput): ActionResult {
  if (!state.teachers.some((teacher) => teacher.id === id)) {
    return fail("That teacher is no longer in this session.");
  }
  update((current) => ({
    ...current,
    teachers: current.teachers.map((teacher) => (teacher.id === id ? { ...teacher, ...input } : teacher)),
  }));
  return ok();
}

export function deleteTeacher(id: string): ActionResult {
  const message = teacherRemovalMessage(state, id);
  if (message) return fail(message);
  update((current) => ({
    ...current,
    teachers: current.teachers.filter((teacher) => teacher.id !== id),
  }));
  return ok();
}

export function addDepartment(input: DepartmentInput): ActionResult {
  const id = nextId("dep", state.departments.map((department) => department.id));
  update((current) => ({ ...current, departments: [...current.departments, { ...input, id }] }));
  return ok();
}

export function updateDepartment(id: string, input: DepartmentInput): ActionResult {
  if (!state.departments.some((department) => department.id === id)) {
    return fail("That department is no longer in this session.");
  }
  update((current) => ({
    ...current,
    departments: current.departments.map((department) =>
      department.id === id ? { ...department, ...input } : department,
    ),
  }));
  return ok();
}

export function deleteDepartment(id: string): ActionResult {
  const message = departmentRemovalMessage(state, id);
  if (message) return fail(message);
  update((current) => ({
    ...current,
    departments: current.departments.filter((department) => department.id !== id),
  }));
  return ok();
}

export function addCourse(input: CourseInput): ActionResult {
  const id = nextId("crs", state.courses.map((course) => course.id));
  update((current) => ({ ...current, courses: [...current.courses, { ...input, id }] }));
  return ok();
}

export function updateCourse(id: string, input: CourseInput): ActionResult {
  if (!state.courses.some((course) => course.id === id)) {
    return fail("That course is no longer in this session.");
  }
  update((current) => ({
    ...current,
    courses: current.courses.map((course) => (course.id === id ? { ...course, ...input } : course)),
  }));
  return ok();
}

export function deleteCourse(id: string): ActionResult {
  update((current) => ({
    ...current,
    courses: current.courses.filter((course) => course.id !== id),
    records: current.records.filter((record) => record.courseId !== id),
  }));
  return ok();
}

export function importRecords(records: AcademicRecordInput[]): ActionResult {
  if (records.length === 0) return fail("There are no valid rows to import.");
  update((current) => {
    let next = current.records;
    records.forEach((input) => {
      const existing = next.find(
        (record) =>
          record.studentId === input.studentId &&
          record.courseId === input.courseId &&
          record.semester === input.semester,
      );
      if (existing) {
        next = next.map((record) => (record.id === existing.id ? { ...existing, ...input } : record));
        return;
      }
      next = [...next, { ...input, id: nextId("rec", next.map((record) => record.id)) }];
    });
    return { ...current, records: next };
  });
  return ok();
}

export function resolveAlert(id: string): ActionResult {
  if (!state.alerts.some((alert) => alert.id === id)) {
    return fail("That alert is no longer in this session.");
  }
  update((current) => ({
    ...current,
    alerts: current.alerts.map((alert) =>
      alert.id === id ? { ...alert, status: "resolved" } : alert,
    ),
  }));
  return ok();
}

export function markNotificationRead(id: string) {
  update((current) => ({
    ...current,
    notifications: current.notifications.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification,
    ),
  }));
}

export function markAllNotificationsRead() {
  update((current) => ({
    ...current,
    notifications: current.notifications.map((notification) => ({ ...notification, read: true })),
  }));
}

export function addUser(input: UserInput): ActionResult {
  const id = nextId("u", state.users.map((user) => user.id));
  update((current) => ({
    ...current,
    users: [...current.users, { ...input, id, createdAt: todayIso() }],
  }));
  return ok();
}

export function updateUser(id: string, input: UserInput): ActionResult {
  const existing = state.users.find((user) => user.id === id);
  if (!existing) return fail("That user is no longer in this session.");
  update((current) => ({
    ...current,
    users: current.users.map((user) => (user.id === id ? { ...user, ...input } : user)),
    settings:
      id === CURRENT_ADMIN_ID
        ? {
            ...current.settings,
            profile: { ...current.settings.profile, name: input.name, email: input.email },
          }
        : current.settings,
  }));
  return ok();
}

export function deleteUser(id: string): ActionResult {
  const message = userRemovalMessage(id);
  if (message) return fail(message);
  update((current) => ({
    ...current,
    users: current.users.filter((user) => user.id !== id),
  }));
  return ok();
}

export function updateProfile(profile: AdminProfile): ActionResult {
  update((current) => ({
    ...current,
    settings: { ...current.settings, profile },
    users: current.users.map((user) =>
      user.id === CURRENT_ADMIN_ID ? { ...user, name: profile.name, email: profile.email } : user,
    ),
  }));
  return ok();
}

export function updateNotificationPreferences(notifications: NotificationPreferences): ActionResult {
  update((current) => ({
    ...current,
    settings: { ...current.settings, notifications },
  }));
  return ok();
}

export function updateThresholds(thresholds: AcademicThresholds): ActionResult {
  update((current) => ({
    ...current,
    settings: { ...current.settings, thresholds },
    students: current.students.map((student) => ({
      ...student,
      riskLevel: deriveRisk(student.gpa, student.attendance, thresholds),
    })),
    predictions: current.predictions.map((prediction) => {
      const student = current.students.find((item) => item.id === prediction.studentId);
      if (!student) return prediction;
      return {
        ...prediction,
        riskLevel: deriveRisk(student.gpa, student.attendance, thresholds),
      };
    }),
  }));
  return ok();
}

export function updateSystemPreferences(system: SystemPreferences): ActionResult {
  update((current) => ({
    ...current,
    settings: { ...current.settings, system },
  }));
  return ok();
}
