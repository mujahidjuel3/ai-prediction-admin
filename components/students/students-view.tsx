"use client";

import { ApiCrudView, type CrudField, type CrudColumn } from "@/components/data/api-crud-view";
import { apiQuery } from "@/lib/api";
import { useApiList } from "@/lib/use-api-list";
import type { LinkableAccount } from "@/types/user";
import type { CreateStudentProfileRequest } from "@/types/student";
import Link from "next/link";

interface Department { id: string; code: string; name: string; }
interface Student { id: string; userId: string | null; studentNumber: string; name: string; email: string | null; departmentId: string; department: { code: string; name: string }; enrollmentYear: number; status: string; }

export function StudentsView({ initialQuery = "" }: { initialQuery?: string }) {
  const { items: departments } = useApiList<Department>("/departments");
  const { items: linkableUsers } = useApiList<LinkableAccount>("/users/linkable?role=STUDENT");
  const fields: CrudField<Student>[] = [
    { name: "studentNumber", label: "Student number", required: true, minLength: 2, maxLength: 64 },
    { name: "name", label: "Name", required: true, minLength: 2, maxLength: 160 },
    { name: "accountMode", label: "Account setup", type: "select", required: true, createOnly: true, options: [{ label: "Create account (local development only)", value: "CREATE" }, { label: "Link existing account", value: "LINK" }] },
    { name: "email", label: "Login email", type: "email", createOnly: true, visibleWhen: { field: "accountMode", value: "CREATE" }, requiredWhen: { field: "accountMode", value: "CREATE" }, hint: "New account password setup is available only for local development." },
    { name: "initialPassword", label: "Temporary setup password", type: "password", createOnly: true, visibleWhen: { field: "accountMode", value: "CREATE" }, requiredWhen: { field: "accountMode", value: "CREATE" }, minLength: 14, maxLength: 128, hint: "14–128 characters. Never returned or emailed; use a temporary local-development credential." },
    { name: "userId", label: "Active unlinked Student account", type: "select", createOnly: true, visibleWhen: { field: "accountMode", value: "LINK" }, requiredWhen: { field: "accountMode", value: "LINK" }, options: linkableUsers.map((user) => ({ label: `${user.name} · ${user.email}`, value: user.id })) },
    { name: "profileEmail", label: "Email", type: "email", editOnly: true, value: (row) => row.email ?? "" },
    { name: "departmentId", label: "Department", type: "select", required: true, value: (row) => row.departmentId, options: departments.map((d) => ({ label: `${d.code} · ${d.name}`, value: d.id })) },
    { name: "enrollmentYear", label: "Enrollment year", type: "number", required: true, min: 1900, max: 2200, step: 1 },
  ];
  const columns: CrudColumn<Student>[] = [
    { label: "Student", value: (row) => <span className="font-medium text-slate-900">{row.name}</span>, sortValue: (row) => row.name },
    { label: "Student number", value: (row) => row.studentNumber, sortValue: (row) => row.studentNumber },
    { label: "Email", value: (row) => row.email ?? "—" },
    { label: "Department", value: (row) => `${row.department.code} · ${row.department.name}` },
    { label: "Enrollment year", value: (row) => row.enrollmentYear, sortValue: (row) => row.enrollmentYear },
    { label: "Status", value: (row) => row.status, sortValue: (row) => row.status },
    { label: "Profile", value: (row) => <Link href={`/students/${row.id}`} className="font-medium text-primary">View</Link> },
  ];
  const initialPath = `/students${apiQuery({ q: initialQuery, page: 1, pageSize: 100 })}`;
  return <ApiCrudView title="Students" description="Student profiles stay linked to an active Student-role account. Direct password setup is for local development only; production account creation requires an approved invitation/reset flow." endpoint={initialPath} writeEndpoint="/students" fields={fields} columns={columns} makePayload={(v, editing) => {
    if (editing) return { studentNumber: v.studentNumber.trim(), name: v.name.trim(), ...(v.profileEmail.trim() ? { email: v.profileEmail.trim() } : {}), departmentId: v.departmentId, enrollmentYear: Number(v.enrollmentYear) };
    const profile = { studentNumber: v.studentNumber.trim(), name: v.name.trim(), departmentId: v.departmentId, enrollmentYear: Number(v.enrollmentYear) };
    const account = v.accountMode === "CREATE" ? { accountMode: "CREATE" as const, email: v.email.trim(), initialPassword: v.initialPassword } : { accountMode: "LINK" as const, userId: v.userId };
    return { ...profile, ...account } satisfies CreateStudentProfileRequest;
  }} accountLink={{ endpointFor: (row) => `/students/${row.id}/link-account`, users: linkableUsers, linked: (row) => Boolean(row.userId), roleLabel: "Student" }} deactivate />;
}
