"use client";

import { ApiCrudView, type CrudColumn, type CrudField } from "@/components/data/api-crud-view";
import { useApiList } from "@/lib/use-api-list";
import type { LinkableAccount } from "@/types/user";
import type { CreateTeacherProfileRequest } from "@/types/teacher";

interface Department { id: string; code: string; name: string; }
interface Teacher { id: string; employeeNumber: string; name: string; email: string | null; departmentId: string; department: { code: string; name: string }; status: string; user: { id: string; email: string; status: string } | null; }

export function TeachersView() {
  const { items: departments } = useApiList<Department>("/departments");
  const { items: linkableUsers } = useApiList<LinkableAccount>("/users/linkable?role=TEACHER");
  const fields: CrudField<Teacher>[] = [
    { name: "employeeNumber", label: "Employee number", required: true, minLength: 2, maxLength: 64 },
    { name: "name", label: "Name", required: true, minLength: 2, maxLength: 160 },
    { name: "accountMode", label: "Account setup", type: "select", required: true, createOnly: true, options: [{ label: "Create account (local development only)", value: "CREATE" }, { label: "Link existing account", value: "LINK" }] },
    { name: "email", label: "Login email", type: "email", createOnly: true, visibleWhen: { field: "accountMode", value: "CREATE" }, requiredWhen: { field: "accountMode", value: "CREATE" }, hint: "New account password setup is available only for local development." },
    { name: "initialPassword", label: "Temporary setup password", type: "password", createOnly: true, visibleWhen: { field: "accountMode", value: "CREATE" }, requiredWhen: { field: "accountMode", value: "CREATE" }, minLength: 14, maxLength: 128, hint: "14–128 characters. Never returned or emailed; use a temporary local-development credential." },
    { name: "userId", label: "Active unlinked Teacher account", type: "select", createOnly: true, visibleWhen: { field: "accountMode", value: "LINK" }, requiredWhen: { field: "accountMode", value: "LINK" }, options: linkableUsers.map((user) => ({ label: `${user.name} · ${user.email}`, value: user.id })) },
    { name: "profileEmail", label: "Email", type: "email", editOnly: true, value: (row) => row.email ?? "" },
    { name: "departmentId", label: "Department", type: "select", required: true, value: (row) => row.departmentId, options: departments.map((d) => ({ label: `${d.code} · ${d.name}`, value: d.id })) },
  ];
  const columns: CrudColumn<Teacher>[] = [
    { label: "Teacher", value: (row) => <span className="font-medium text-slate-900">{row.name}</span>, sortValue: (row) => row.name },
    { label: "Employee number", value: (row) => row.employeeNumber, sortValue: (row) => row.employeeNumber },
    { label: "Email", value: (row) => row.email ?? "—" },
    { label: "Department", value: (row) => `${row.department.code} · ${row.department.name}` },
    { label: "Status", value: (row) => row.status, sortValue: (row) => row.status },
  ];
  return <ApiCrudView title="Teachers" description="Teacher profiles stay linked to an active Teacher-role account. Direct password setup is for local development only; production account creation requires an approved invitation/reset flow. Deactivation is refused while course offerings remain assigned." endpoint="/teachers?page=1&pageSize=100" writeEndpoint="/teachers" fields={fields} columns={columns} makePayload={(v, editing) => {
    if (editing) return { employeeNumber: v.employeeNumber.trim(), name: v.name.trim(), ...(v.profileEmail.trim() ? { email: v.profileEmail.trim() } : {}), departmentId: v.departmentId };
    const profile = { employeeNumber: v.employeeNumber.trim(), name: v.name.trim(), departmentId: v.departmentId };
    const account = v.accountMode === "CREATE" ? { accountMode: "CREATE" as const, email: v.email.trim(), initialPassword: v.initialPassword } : { accountMode: "LINK" as const, userId: v.userId };
    return { ...profile, ...account } satisfies CreateTeacherProfileRequest;
  }} accountLink={{ endpointFor: (row) => `/teachers/${row.id}/link-account`, users: linkableUsers, linked: (row) => Boolean(row.user?.id), roleLabel: "Teacher" }} deactivate />;
}
