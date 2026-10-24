"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormActions } from "@/components/ui/form-actions";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { addStudent, updateStudent, useAdminState } from "@/lib/store";
import { semesterOptions, statusLabel } from "@/lib/utils";
import {
  emptyStudentForm,
  studentToForm,
  validateStudentForm,
  type StudentFormValues,
} from "@/lib/validation";
import type { FieldErrors } from "@/types/common";
import type { Student } from "@/types/student";
import { useState, type FormEvent } from "react";

interface StudentFormProps {
  student?: Student;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export function StudentForm({ student, onClose, onSaved }: StudentFormProps) {
  const state = useAdminState();
  const [values, setValues] = useState<StudentFormValues>(() =>
    student ? studentToForm(student) : emptyStudentForm(state.departments[0]?.id ?? ""),
  );
  const [errors, setErrors] = useState<FieldErrors>({});

  function setField<K extends keyof StudentFormValues>(key: K, value: StudentFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateStudentForm(values, state, student?.id);
    setErrors(result.errors);
    if (!result.value) return;
    const action = student
      ? updateStudent(student.id, result.value)
      : addStudent(result.value);
    if (!action.ok) {
      setErrors({ form: action.message });
      return;
    }
    onSaved(
      student
        ? "Student updated in this demonstration session."
        : "Student added in this demonstration session. Risk was calculated from the current thresholds, and no model was called.",
    );
    onClose();
  }

  return (
    <Dialog
      open
      size="lg"
      title={student ? "Edit student" : "Add student"}
      description="Changes stay in this browser session and are not written to a database."
      onClose={onClose}
    >
      <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {errors.form ? (
          <p role="alert" className="text-sm text-danger sm:col-span-2">
            {errors.form}
          </p>
        ) : null}
        <Input id="student-id" label="Student ID" hint="Example: CSE-2026-014" value={values.studentId} error={errors.studentId} onChange={(event) => setField("studentId", event.target.value)} data-initial-focus />
        <Input id="student-name" label="Name" value={values.name} error={errors.name} onChange={(event) => setField("name", event.target.value)} />
        <Input id="student-email" label="Email" type="email" value={values.email} error={errors.email} onChange={(event) => setField("email", event.target.value)} />
        <Input id="student-phone" label="Phone" value={values.phone} error={errors.phone} onChange={(event) => setField("phone", event.target.value)} />
        <Select id="student-department" label="Department" value={values.departmentId} error={errors.departmentId} onChange={(event) => setField("departmentId", event.target.value)} options={state.departments.map((department) => ({ label: department.name, value: department.id }))} />
        <Select id="student-semester" label="Semester" value={values.semester} error={errors.semester} onChange={(event) => setField("semester", event.target.value)} options={semesterOptions()} />
        <Input id="student-year" label="Enrollment year" inputMode="numeric" value={values.enrollmentYear} error={errors.enrollmentYear} onChange={(event) => setField("enrollmentYear", event.target.value)} />
        <Select id="student-status" label="Enrollment" value={values.enrollmentStatus} onChange={(event) => setField("enrollmentStatus", event.target.value as StudentFormValues["enrollmentStatus"])} options={[{ label: statusLabel("enrolled"), value: "enrolled" }, { label: statusLabel("on-leave"), value: "on-leave" }]} />
        <Input id="student-gpa" label="GPA" inputMode="decimal" hint="0 to 4. Risk is calculated from Settings thresholds." value={values.gpa} error={errors.gpa} onChange={(event) => setField("gpa", event.target.value)} />
        <Input id="student-attendance" label="Attendance %" inputMode="decimal" value={values.attendance} error={errors.attendance} onChange={(event) => setField("attendance", event.target.value)} />
        <Input id="student-assignment" label="Assignment average" inputMode="decimal" value={values.assignmentAverage} error={errors.assignmentAverage} onChange={(event) => setField("assignmentAverage", event.target.value)} />
        <Input id="student-quiz" label="Quiz average" inputMode="decimal" value={values.quizAverage} error={errors.quizAverage} onChange={(event) => setField("quizAverage", event.target.value)} />
        <Input id="student-midterm" label="Midterm score" inputMode="decimal" value={values.midtermScore} error={errors.midtermScore} onChange={(event) => setField("midtermScore", event.target.value)} />
        <div className="sm:col-span-2">
          <FormActions>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{student ? "Save changes" : "Add student"}</Button>
          </FormActions>
        </div>
      </form>
    </Dialog>
  );
}
