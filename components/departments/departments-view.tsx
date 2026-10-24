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
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { departmentRemovalMessage } from "@/lib/guards";
import { departmentRows, type DepartmentRow } from "@/lib/selectors";
import { addDepartment, deleteDepartment, updateDepartment, useAdminState } from "@/lib/store";
import { includesQuery } from "@/lib/utils";
import type { FieldErrors } from "@/types/common";
import { validateDepartmentForm, type DepartmentFormValues } from "@/lib/validation";
import { Plus } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

export function DepartmentsView() {
  const state = useAdminState();
  const rows = departmentRows(state);
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [editing, setEditing] = useState<DepartmentRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState<DepartmentRow | null>(null);
  const [message, setMessage] = useState("");

  const filtered = useMemo(
    () =>
      rows.filter((department) => {
        const matchesQuery = includesQuery(query, [department.name, department.code, department.headName]);
        const matchesRisk = riskFilter === "all" || department.highRiskCount > 0;
        return matchesQuery && matchesRisk;
      }),
    [rows, query, riskFilter],
  );

  function requestDelete(department: DepartmentRow) {
    const blocked = departmentRemovalMessage(state, department.id);
    if (blocked) {
      setMessage(blocked);
      return;
    }
    setPending(department);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Departments"
        description="Department codes, heads, and the current session counts for teachers, students, and courses."
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" aria-hidden="true" />Add department</Button>}
      />
      <Feedback message={message} />
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input id="department-search" label="Search" placeholder="Name, code, or head" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select id="department-risk" label="Filter" value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)} options={[{ label: "All departments", value: "all" }, { label: "Has high-risk students", value: "high" }]} />
        </div>
      </Card>
      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No departments match" description="Adjust the search or filter." />
        ) : (
          <>
            <div className="hidden lg:block">
              <Table className="min-w-[880px]">
                <caption className="sr-only">Departments</caption>
                <THead>
                  <TR>
                    <TH>Department</TH><TH>Code</TH><TH>Head</TH><TH>Teachers</TH><TH>Students</TH><TH>Courses</TH><TH>High risk</TH><TH>Actions</TH>
                  </TR>
                </THead>
                <TBody>
                  {filtered.map((department) => (
                    <TR key={department.id}>
                      <TD className="whitespace-normal font-medium text-slate-900">{department.name}</TD>
                      <TD>{department.code}</TD>
                      <TD>{department.headName}</TD>
                      <TD>{department.teacherCount}</TD>
                      <TD>{department.studentCount}</TD>
                      <TD>{department.courseCount}</TD>
                      <TD>{department.highRiskCount}</TD>
                      <TD>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditing(department)}>Edit</Button>
                          <Button variant="ghost" size="sm" className="text-danger" onClick={() => requestDelete(department)}>Delete</Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            <div className="space-y-3 p-4 lg:hidden">
              {filtered.map((department) => (
                <article key={department.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-medium text-slate-900">{department.name}</p>
                  <p className="text-xs text-slate-500">{department.code} · {department.headName}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div><dt>Teachers</dt><dd className="font-medium text-slate-900">{department.teacherCount}</dd></div>
                    <div><dt>Students</dt><dd className="font-medium text-slate-900">{department.studentCount}</dd></div>
                    <div><dt>Courses</dt><dd className="font-medium text-slate-900">{department.courseCount}</dd></div>
                    <div><dt>High risk</dt><dd className="font-medium text-slate-900">{department.highRiskCount}</dd></div>
                  </dl>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(department)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-danger" onClick={() => requestDelete(department)}>Delete</Button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </Card>
      {creating ? <DepartmentForm onClose={() => setCreating(false)} onSaved={setMessage} /> : null}
      {editing ? <DepartmentForm department={editing} onClose={() => setEditing(null)} onSaved={setMessage} /> : null}
      <ConfirmDialog
        open={pending !== null}
        title="Delete department"
        description={pending ? `Remove ${pending.name} from this demonstration session?` : ""}
        confirmLabel="Delete department"
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          const result = deleteDepartment(pending.id);
          setMessage(result.ok ? "Department removed from this demonstration session." : result.message);
          setPending(null);
        }}
      />
    </div>
  );
}

function DepartmentForm({
  department,
  onClose,
  onSaved,
}: {
  department?: DepartmentRow;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const state = useAdminState();
  const [values, setValues] = useState<DepartmentFormValues>({
    name: department?.name ?? "",
    code: department?.code ?? "",
    headTeacherId: department?.headTeacherId ?? state.teachers[0]?.id ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateDepartmentForm(values, state, department?.id);
    setErrors(result.errors);
    if (!result.value) return;
    const action = department
      ? updateDepartment(department.id, result.value)
      : addDepartment(result.value);
    if (!action.ok) {
      setErrors({ form: action.message });
      return;
    }
    onSaved(department ? "Department updated in this demonstration session." : "Department added in this demonstration session.");
    onClose();
  }

  return (
    <Dialog open title={department ? "Edit department" : "Add department"} description="Counts are calculated from the current session. They are not stored on the department itself." onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className="space-y-3">
        {errors.form ? <p role="alert" className="text-sm text-danger">{errors.form}</p> : null}
        <Input id="department-name" label="Name" value={values.name} error={errors.name} onChange={(event) => setValues({ ...values, name: event.target.value })} data-initial-focus />
        <Input id="department-code" label="Code" hint="2 to 6 letters, such as CSE." value={values.code} error={errors.code} onChange={(event) => setValues({ ...values, code: event.target.value })} />
        <Select
          id="department-head"
          label="Head of department"
          value={values.headTeacherId}
          error={errors.headTeacherId}
          onChange={(event) => setValues({ ...values, headTeacherId: event.target.value })}
          options={state.teachers.map((teacher) => ({
            label: `${teacher.name}${teacher.status === "inactive" ? " (inactive)" : ""}`,
            value: teacher.id,
          }))}
        />
        <FormActions>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{department ? "Save changes" : "Add department"}</Button>
        </FormActions>
      </form>
    </Dialog>
  );
}
