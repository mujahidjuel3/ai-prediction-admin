"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DemoNotice } from "@/components/ui/demo-notice";
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
import { USER_ROLES } from "@/lib/constants";
import { userRemovalMessage } from "@/lib/guards";
import { addUser, deleteUser, updateUser, useAdminState } from "@/lib/store";
import { formatDate, includesQuery, roleLabel } from "@/lib/utils";
import type { FieldErrors } from "@/types/common";
import type { AdminUser, UserRole, UserStatus } from "@/types/user";
import { validateUserForm, type UserFormValues } from "@/lib/validation";
import { Plus } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

export function UsersView() {
  const state = useAdminState();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState<AdminUser | null>(null);
  const [message, setMessage] = useState("");

  const filtered = useMemo(
    () =>
      state.users.filter((user) => {
        const matchesQuery = includesQuery(query, [user.name, user.email]);
        const matchesRole = role === "all" || user.role === role;
        const matchesStatus = status === "all" || user.status === status;
        return matchesQuery && matchesRole && matchesStatus;
      }),
    [state.users, query, role, status],
  );
  const pagination = usePagination(filtered, state.settings.system.pageSize);

  function requestDelete(user: AdminUser) {
    const blocked = userRemovalMessage(user.id);
    if (blocked) {
      setMessage(blocked);
      return;
    }
    setPending(user);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="User management"
        description="Directory of demonstration accounts. Passwords are not collected or stored."
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" aria-hidden="true" />Add user</Button>}
      />
      <DemoNotice>These accounts cannot sign in. Authentication has to be enforced by a future backend.</DemoNotice>
      <Feedback message={message} />
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input id="user-search" label="Search" placeholder="Name or email" value={query} onChange={(event) => { setQuery(event.target.value); pagination.setPage(1); }} />
          <Select id="user-role" label="Role" value={role} onChange={(event) => { setRole(event.target.value); pagination.setPage(1); }} options={[{ label: "All roles", value: "all" }, ...USER_ROLES.map((item) => ({ label: roleLabel(item), value: item }))]} />
          <Select id="user-status" label="Status" value={status} onChange={(event) => { setStatus(event.target.value); pagination.setPage(1); }} options={[{ label: "All statuses", value: "all" }, { label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} />
        </div>
      </Card>
      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No users match" description="Adjust the search or filters." />
        ) : (
          <>
            <div className="hidden lg:block">
              <Table>
                <caption className="sr-only">Users</caption>
                <THead>
                  <TR>
                    <TH>Name</TH><TH>Email</TH><TH>Role</TH><TH>Status</TH><TH>Created</TH><TH>Actions</TH>
                  </TR>
                </THead>
                <TBody>
                  {pagination.pagedItems.map((user) => (
                    <TR key={user.id}>
                      <TD><PersonIdentity name={user.name} /></TD>
                      <TD>{user.email}</TD>
                      <TD>{roleLabel(user.role)}</TD>
                      <TD><ActiveBadge status={user.status} /></TD>
                      <TD>{formatDate(user.createdAt)}</TD>
                      <TD>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditing(user)}>Edit</Button>
                          <Button variant="ghost" size="sm" className="text-danger" onClick={() => requestDelete(user)}>Delete</Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            <div className="space-y-3 p-4 lg:hidden">
              {pagination.pagedItems.map((user) => (
                <article key={user.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <PersonIdentity name={user.name} secondary={roleLabel(user.role)} />
                    <ActiveBadge status={user.status} />
                  </div>
                  <p className="mt-2 break-all text-xs text-slate-500">{user.email}</p>
                  <p className="text-xs text-slate-500">Created {formatDate(user.createdAt)}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(user)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-danger" onClick={() => requestDelete(user)}>Delete</Button>
                  </div>
                </article>
              ))}
            </div>
            <Pagination {...pagination} onPageChange={pagination.setPage} />
          </>
        )}
      </Card>
      {creating ? <UserForm onClose={() => setCreating(false)} onSaved={setMessage} /> : null}
      {editing ? <UserForm user={editing} onClose={() => setEditing(null)} onSaved={setMessage} /> : null}
      <ConfirmDialog
        open={pending !== null}
        title="Delete user"
        description={pending ? `Remove ${pending.name} from this demonstration directory?` : ""}
        confirmLabel="Delete user"
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          const result = deleteUser(pending.id);
          setMessage(result.ok ? "User removed from this demonstration session." : result.message);
          setPending(null);
        }}
      />
    </div>
  );
}

function UserForm({
  user,
  onClose,
  onSaved,
}: {
  user?: AdminUser;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const state = useAdminState();
  const [values, setValues] = useState<UserFormValues>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: user?.role ?? "advisor",
    status: user?.status ?? "active",
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateUserForm(values, state, user?.id);
    setErrors(result.errors);
    if (!result.value) return;
    const action = user ? updateUser(user.id, result.value) : addUser(result.value);
    if (!action.ok) {
      setErrors({ form: action.message });
      return;
    }
    onSaved(user ? "User updated in this demonstration session." : "User added in this demonstration session. No password was created.");
    onClose();
  }

  return (
    <Dialog open title={user ? "Edit user" : "Add user"} description="Role and status are labels for this demonstration. They do not grant access." onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className="space-y-3">
        {errors.form ? <p role="alert" className="text-sm text-danger">{errors.form}</p> : null}
        <Input id="user-name" label="Name" value={values.name} error={errors.name} onChange={(event) => setValues({ ...values, name: event.target.value })} data-initial-focus />
        <Input id="user-email" label="Email" type="email" value={values.email} error={errors.email} onChange={(event) => setValues({ ...values, email: event.target.value })} />
        <Select id="user-form-role" label="Role" value={values.role} onChange={(event) => setValues({ ...values, role: event.target.value as UserRole })} options={USER_ROLES.map((item) => ({ label: roleLabel(item), value: item }))} />
        <Select id="user-form-status" label="Status" value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value as UserStatus })} options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} />
        <FormActions>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{user ? "Save changes" : "Add user"}</Button>
        </FormActions>
      </form>
    </Dialog>
  );
}
