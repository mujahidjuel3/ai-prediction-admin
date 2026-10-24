"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Feedback } from "@/components/ui/feedback";
import { FormActions } from "@/components/ui/form-actions";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { RiskBadge } from "@/components/ui/status-badges";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { usePagination } from "@/hooks/use-pagination";
import { recordRisk } from "@/lib/academics";
import { courseRows, recordRows, type CourseRow } from "@/lib/selectors";
import { addCourse, deleteCourse, updateCourse, useAdminState } from "@/lib/store";
import { formatPercent, includesQuery, selectedOrAll, semesterOptions } from "@/lib/utils";
import type { FieldErrors } from "@/types/common";
import { validateCourseForm, type CourseFormValues } from "@/lib/validation";
import { Plus } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

export function CoursesView() {
  const state = useAdminState();
  const rows = courseRows(state);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [semester, setSemester] = useState("all");
  const [editing, setEditing] = useState<CourseRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [details, setDetails] = useState<CourseRow | null>(null);
  const [pending, setPending] = useState<CourseRow | null>(null);
  const [message, setMessage] = useState("");
  const departmentId = selectedOrAll(department, state.departments.map((item) => item.id));

  const filtered = useMemo(
    () =>
      rows.filter((course) => {
        const matchesQuery = includesQuery(query, [course.name, course.code, course.teacherName]);
        const matchesDepartment = departmentId === "all" || course.departmentId === departmentId;
        const matchesSemester = semester === "all" || course.semester === Number(semester);
        return matchesQuery && matchesDepartment && matchesSemester;
      }),
    [rows, query, departmentId, semester],
  );
  const pagination = usePagination(filtered, state.settings.system.pageSize);
  const detailRecords = details
    ? recordRows(state).filter((record) => record.courseId === details.id)
    : [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Courses"
        description="Course assignments and demonstration scores. Averages are calculated from session records, not from an official results archive."
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" aria-hidden="true" />Add course</Button>}
      />
      <Feedback message={message} />
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input id="course-search" label="Search" placeholder="Name, code, or teacher" value={query} onChange={(event) => { setQuery(event.target.value); pagination.setPage(1); }} />
          <Select id="course-department" label="Department" value={departmentId} onChange={(event) => { setDepartment(event.target.value); pagination.setPage(1); }} options={[{ label: "All departments", value: "all" }, ...state.departments.map((item) => ({ label: item.code, value: item.id }))]} />
          <Select id="course-semester" label="Semester" value={semester} onChange={(event) => { setSemester(event.target.value); pagination.setPage(1); }} options={semesterOptions(true)} />
        </div>
      </Card>
      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No courses match these filters" description="Adjust the search or add a course to this session." />
        ) : (
          <>
            <div className="hidden lg:block">
              <Table className="min-w-[980px]">
                <caption className="sr-only">Courses</caption>
                <THead>
                  <TR>
                    <TH>Course</TH><TH>Code</TH><TH>Department</TH><TH>Semester</TH><TH>Teacher</TH><TH>Students</TH><TH>Average</TH><TH>High-risk records</TH><TH>Actions</TH>
                  </TR>
                </THead>
                <TBody>
                  {pagination.pagedItems.map((course) => (
                    <TR key={course.id}>
                      <TD className="font-medium text-slate-900">{course.name}</TD>
                      <TD>{course.code}</TD>
                      <TD>{course.departmentName}</TD>
                      <TD>{course.semester}</TD>
                      <TD>{course.teacherName}</TD>
                      <TD>{course.studentCount}</TD>
                      <TD>{course.averageScore === null ? "—" : course.averageScore}</TD>
                      <TD>{course.highRiskPercent === null ? "—" : formatPercent(course.highRiskPercent)}</TD>
                      <TD>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setDetails(course)}>Details</Button>
                          <Button variant="outline" size="sm" onClick={() => setEditing(course)}>Edit</Button>
                          <Button variant="ghost" size="sm" className="text-danger" onClick={() => setPending(course)}>Delete</Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            <div className="space-y-3 p-4 lg:hidden">
              {pagination.pagedItems.map((course) => (
                <article key={course.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-medium text-slate-900">{course.name}</p>
                  <p className="text-xs text-slate-500">{course.code} · Semester {course.semester}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div><dt>Department</dt><dd className="font-medium text-slate-900">{course.departmentName}</dd></div>
                    <div><dt>Teacher</dt><dd className="font-medium text-slate-900">{course.teacherName}</dd></div>
                    <div><dt>Students</dt><dd className="font-medium text-slate-900">{course.studentCount}</dd></div>
                    <div><dt>Average</dt><dd className="font-medium text-slate-900">{course.averageScore ?? "—"}</dd></div>
                    <div className="col-span-2"><dt>High-risk records</dt><dd className="font-medium text-slate-900">{course.highRiskPercent === null ? "—" : formatPercent(course.highRiskPercent)}</dd></div>
                  </dl>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDetails(course)}>Details</Button>
                    <Button variant="outline" size="sm" onClick={() => setEditing(course)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-danger" onClick={() => setPending(course)}>Delete</Button>
                  </div>
                </article>
              ))}
            </div>
            <Pagination {...pagination} onPageChange={pagination.setPage} />
          </>
        )}
      </Card>

      {creating ? <CourseForm onClose={() => setCreating(false)} onSaved={setMessage} /> : null}
      {editing ? <CourseForm course={editing} onClose={() => setEditing(null)} onSaved={setMessage} /> : null}
      <Dialog open={details !== null} size="lg" title={details ? details.name : "Course"} description={details ? `${details.code} · ${details.credits} credits` : undefined} onClose={() => setDetails(null)}>
        {detailRecords.length === 0 ? (
          <p className="text-sm text-slate-500">No academic records are linked to this course.</p>
        ) : (
          <Card>
            <CardHeader><CardTitle>Enrolled records</CardTitle></CardHeader>
            <CardContent className="space-y-3 px-0">
              {detailRecords.map((record) => {
                const full = state.records.find((item) => item.id === record.id);
                const risk = full ? recordRisk(full) : "low";
                return (
                  <div key={record.id} className="flex items-start justify-between gap-3 border-t border-slate-100 px-5 py-3 first:border-t-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{record.studentName}</p>
                      <p className="text-xs text-slate-500">{record.publicStudentId} · Semester {record.semester}</p>
                    </div>
                    <RiskBadge level={risk} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </Dialog>
      <ConfirmDialog
        open={pending !== null}
        title="Delete course"
        description={pending ? `Remove ${pending.name}? Academic records for this course will also be removed from the demonstration session.` : ""}
        confirmLabel="Delete course"
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          deleteCourse(pending.id);
          setMessage("Course and its demonstration records were removed from this session.");
          setPending(null);
        }}
      />
    </div>
  );
}

function CourseForm({
  course,
  onClose,
  onSaved,
}: {
  course?: CourseRow;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const state = useAdminState();
  const [values, setValues] = useState<CourseFormValues>({
    name: course?.name ?? "",
    code: course?.code ?? "",
    departmentId: course?.departmentId ?? state.departments[0]?.id ?? "",
    semester: String(course?.semester ?? 1),
    teacherId: course?.teacherId ?? "",
    credits: String(course?.credits ?? 3),
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateCourseForm(values, state, course?.id);
    setErrors(result.errors);
    if (!result.value) return;
    const action = course ? updateCourse(course.id, result.value) : addCourse(result.value);
    if (!action.ok) {
      setErrors({ form: action.message });
      return;
    }
    onSaved(course ? "Course updated in this demonstration session." : "Course added in this demonstration session.");
    onClose();
  }

  return (
    <Dialog open size="lg" title={course ? "Edit course" : "Add course"} description="Saving a course does not create assessment results." onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {errors.form ? <p role="alert" className="text-sm text-danger sm:col-span-2">{errors.form}</p> : null}
        <Input id="course-name" label="Course name" value={values.name} error={errors.name} onChange={(event) => setValues({ ...values, name: event.target.value })} data-initial-focus />
        <Input id="course-code" label="Code" hint="Example: CSE 310" value={values.code} error={errors.code} onChange={(event) => setValues({ ...values, code: event.target.value })} />
        <Select id="course-form-department" label="Department" value={values.departmentId} error={errors.departmentId} onChange={(event) => setValues({ ...values, departmentId: event.target.value })} options={state.departments.map((item) => ({ label: item.name, value: item.id }))} />
        <Select id="course-form-semester" label="Semester" value={values.semester} error={errors.semester} onChange={(event) => setValues({ ...values, semester: event.target.value })} options={semesterOptions()} />
        <Select id="course-teacher" label="Assigned teacher" value={values.teacherId} error={errors.teacherId} onChange={(event) => setValues({ ...values, teacherId: event.target.value })} options={[{ label: "Unassigned", value: "" }, ...state.teachers.map((teacher) => ({ label: teacher.name, value: teacher.id }))]} />
        <Input id="course-credits" label="Credits" inputMode="numeric" value={values.credits} error={errors.credits} onChange={(event) => setValues({ ...values, credits: event.target.value })} />
        <div className="sm:col-span-2">
          <FormActions>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{course ? "Save changes" : "Add course"}</Button>
          </FormActions>
        </div>
      </form>
    </Dialog>
  );
}
