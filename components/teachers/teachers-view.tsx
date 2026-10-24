"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Feedback } from "@/components/ui/feedback";
import { FormActions } from "@/components/ui/form-actions";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { PersonIdentity } from "@/components/ui/person-identity";
import { Select } from "@/components/ui/select";
import { ActiveBadge } from "@/components/ui/status-badges";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { usePagination } from "@/hooks/use-pagination";
import { teacherRemovalMessage } from "@/lib/guards";
import { teacherRows, type TeacherRow } from "@/lib/selectors";
import { addTeacher, deleteTeacher, updateTeacher, useAdminState } from "@/lib/store";
import { includesQuery, selectedOrAll, statusLabel } from "@/lib/utils";
import type { FieldErrors } from "@/types/common";
import {
  emptyTeacherForm,
  validateTeacherForm,
  type TeacherFormValues,
} from "@/lib/validation";
import { Plus } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

export function TeachersView() {
  const state = useAdminState();
  const rows = teacherRows(state);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [editing, setEditing] = useState<TeacherRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState<TeacherRow | null>(null);
  const [message, setMessage] = useState("");
  const departmentId = selectedOrAll(department, state.departments.map((item) => item.id));

  const filtered = useMemo(
    () =>
      rows.filter((teacher) => {
        const matchesQuery = includesQuery(query, [teacher.name, teacher.employeeId, teacher.email]);
        const matchesDepartment = departmentId === "all" || teacher.departmentId === departmentId;
        return matchesQuery && matchesDepartment;
      }),
    [rows, query, departmentId],
  );
  const pagination = usePagination(filtered, state.settings.system.pageSize);

  function requestDelete(teacher: TeacherRow) {
    const blocked = teacherRemovalMessage(state, teacher.id);
    if (blocked) {
      setMessage(blocked);
      return;
    }
    setPending(teacher);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Teachers"
        description="Directory of teaching staff, assigned courses, and student counts from course records."
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" aria-hidden="true" />Add teacher</Button>}
      />
      <Feedback message={message} />
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input id="teacher-search" label="Search" placeholder="Name, employee ID, or email" value={query} onChange={(event) => { setQuery(event.target.value); pagination.setPage(1); }} />
          <Select id="teacher-department" label="Department" value={departmentId} onChange={(event) => { setDepartment(event.target.value); pagination.setPage(1); }} options={[{ label: "All departments", value: "all" }, ...state.departments.map((item) => ({ label: item.name, value: item.id }))]} />
        </div>
      </Card>
      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No teachers match these filters" description="Try another name or department." />
        ) : (
          <>
            <div className="hidden lg:block">
              <Table>
                <caption className="sr-only">Teachers</caption>
                <THead>
                  <TR>
                    <TH>Teacher</TH><TH>Employee ID</TH><TH>Department</TH><TH>Courses</TH><TH>Students</TH><TH>Contact</TH><TH>Status</TH><TH>Actions</TH>
                  </TR>
                </THead>
                <TBody>
                  {pagination.pagedItems.map((teacher) => (
                    <TR key={teacher.id}>
                      <TD><PersonIdentity name={teacher.name} /></TD>
                      <TD>{teacher.employeeId}</TD>
                      <TD>{teacher.departmentName}</TD>
                      <TD className="max-w-[220px] whitespace-normal">{teacher.courseCodes.length ? teacher.courseCodes.join(", ") : "None"}</TD>
                      <TD>{teacher.studentCount}</TD>
                      <TD className="whitespace-normal">
                        <p>{teacher.email}</p>
                        <p className="text-xs text-slate-500">{teacher.phone}</p>
                      </TD>
                      <TD><ActiveBadge status={teacher.status} /></TD>
                      <TD>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditing(teacher)}>Edit</Button>
                          <Button variant="ghost" size="sm" className="text-danger" onClick={() => requestDelete(teacher)}>Delete</Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            <div className="space-y-3 p-4 lg:hidden">
              {pagination.pagedItems.map((teacher) => (
                <article key={teacher.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <PersonIdentity name={teacher.name} secondary={teacher.employeeId} />
                    <ActiveBadge status={teacher.status} />
                  </div>
                  <dl className="mt-3 space-y-1 text-xs text-slate-500">
                    <div><dt className="sr-only">Department</dt><dd className="font-medium text-slate-900">{teacher.departmentName}</dd></div>
                    <div><dt>Courses</dt><dd className="font-medium text-slate-900">{teacher.courseCodes.length ? teacher.courseCodes.join(", ") : "None"}</dd></div>
                    <div><dt>Students</dt><dd className="font-medium text-slate-900">{teacher.studentCount}</dd></div>
                    <div><dt>Email</dt><dd className="break-all font-medium text-slate-900">{teacher.email}</dd></div>
                    <div><dt>Phone</dt><dd className="font-medium text-slate-900">{teacher.phone}</dd></div>
                  </dl>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(teacher)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-danger" onClick={() => requestDelete(teacher)}>Delete</Button>
                  </div>
                </article>
              ))}
            </div>
            <Pagination {...pagination} onPageChange={pagination.setPage} />
          </>
        )}
      </Card>
      {creating ? (
        <TeacherForm onClose={() => setCreating(false)} onSaved={setMessage} />
      ) : null}
      {editing ? (
        <TeacherForm teacher={editing} onClose={() => setEditing(null)} onSaved={setMessage} />
      ) : null}
      <ConfirmDialog
        open={pending !== null}
        title="Delete teacher"
        description={pending ? `Remove ${pending.name} from this demonstration session?` : ""}
        confirmLabel="Delete teacher"
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          const result = deleteTeacher(pending.id);
          setMessage(result.ok ? "Teacher removed from this demonstration session." : result.message);
          setPending(null);
        }}
      />
    </div>
  );
}

function TeacherForm({
  teacher,
  onClose,
  onSaved,
}: {
  teacher?: TeacherRow;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const state = useAdminState();
  const [values, setValues] = useState<TeacherFormValues>(() =>
    teacher
      ? {
          employeeId: teacher.employeeId,
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone,
          departmentId: teacher.departmentId,
          status: teacher.status,
        }
      : emptyTeacherForm(state.departments[0]?.id ?? ""),
  );
  const [errors, setErrors] = useState<FieldErrors>({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateTeacherForm(values, state, teacher?.id);
    setErrors(result.errors);
    if (!result.value) return;
    const action = teacher ? updateTeacher(teacher.id, result.value) : addTeacher(result.value);
    if (!action.ok) {
      setErrors({ form: action.message });
      return;
    }
    onSaved(teacher ? "Teacher updated in this demonstration session." : "Teacher added in this demonstration session.");
    onClose();
  }

  return (
    <Dialog open size="lg" title={teacher ? "Edit teacher" : "Add teacher"} description="Contact details are fictional and are not connected to a directory service." onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {errors.form ? <p role="alert" className="text-sm text-danger sm:col-span-2">{errors.form}</p> : null}
        <Input id="teacher-employee" label="Employee ID" value={values.employeeId} error={errors.employeeId} onChange={(event) => setValues({ ...values, employeeId: event.target.value })} data-initial-focus />
        <Input id="teacher-name" label="Name" value={values.name} error={errors.name} onChange={(event) => setValues({ ...values, name: event.target.value })} />
        <Input id="teacher-email" label="Email" type="email" value={values.email} error={errors.email} onChange={(event) => setValues({ ...values, email: event.target.value })} />
        <Input id="teacher-phone" label="Phone" value={values.phone} error={errors.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} />
        <Select id="teacher-form-department" label="Department" value={values.departmentId} error={errors.departmentId} onChange={(event) => setValues({ ...values, departmentId: event.target.value })} options={state.departments.map((item) => ({ label: item.name, value: item.id }))} />
        <Select id="teacher-status" label="Status" value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value as TeacherFormValues["status"] })} options={[{ label: statusLabel("active"), value: "active" }, { label: statusLabel("inactive"), value: "inactive" }]} />
        <div className="sm:col-span-2">
          <FormActions>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{teacher ? "Save changes" : "Add teacher"}</Button>
          </FormActions>
        </div>
      </form>
    </Dialog>
  );
}
