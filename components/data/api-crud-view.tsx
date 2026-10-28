"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { SortableHeader } from "@/components/ui/sortable-header";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { ApiError, apiDelete, apiPatch, apiPost } from "@/lib/api";
import { useApiList } from "@/lib/use-api-list";
import { usePagination } from "@/hooks/use-pagination";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { SortDirection } from "@/types/common";
import type { LinkableAccount } from "@/types/user";

export interface CrudField<T = ApiRecord> { name: string; label: string; type?: "text" | "email" | "number" | "password" | "select"; options?: { label: string; value: string }[]; required?: boolean; requiredWhen?: { field: string; value: string }; visibleWhen?: { field: string; value: string }; hint?: string; min?: number; max?: number; step?: number; minLength?: number; maxLength?: number; createOnly?: boolean; editOnly?: boolean; value?: (row: T) => string; }
export interface CrudColumn<T> { label: string; value: (row: T) => ReactNode; sortValue?: (row: T) => string | number | null; }
interface ApiRecord { id: string; }
interface AccountLinkConfig<T> { endpointFor: (row: T) => string; users: LinkableAccount[]; linked: (row: T) => boolean; roleLabel: string; }

export function ApiCrudView<T extends ApiRecord>({ title, description, endpoint, writeEndpoint = endpoint, fields, columns, makePayload, deactivate = false, accountLink }: {
  title: string; description: string; endpoint: string; writeEndpoint?: string; fields: CrudField<T>[]; columns: CrudColumn<T>[];
  makePayload?: (values: Record<string, string>, editing: boolean) => unknown; deactivate?: boolean; accountLink?: AccountLinkConfig<T>;
}) {
  const { items, loading, error, reload } = useApiList<T>(endpoint);
  const [editing, setEditing] = useState<T | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [linkTarget, setLinkTarget] = useState<T | null>(null);
  const [linkValues, setLinkValues] = useState({ accountMode: "" as "" | "CREATE" | "LINK", email: "", initialPassword: "", userId: "" });
  const [linkError, setLinkError] = useState("");
  const visible = useMemo(() => {
    const filtered = items.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
    const column = columns.find((candidate) => candidate.label === sortKey && candidate.sortValue);
    if (!column?.sortValue) return filtered;
    return [...filtered].sort((left, right) => {
      const a = column.sortValue!(left);
      const b = column.sortValue!(right);
      const compared = typeof a === "number" && typeof b === "number" ? a - b : String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? compared : -compared;
    });
  }, [items, query, columns, sortDirection, sortKey]);
  const pagination = usePagination(visible, 10);
  const setPage = pagination.setPage;
  useEffect(() => { setPage(1); }, [query, setPage]);
  function changeSort(column: string) {
    setSortDirection((direction) => sortKey === column && direction === "asc" ? "desc" : "asc");
    setSortKey(column);
    setPage(1);
  }
  function begin(row?: T) { setEditing(row ?? null); setFormError(""); setFieldErrors({}); setMessage(""); setValues(Object.fromEntries(fields.map((field) => [field.name, row ? (field.value ? field.value(row) : String((row as Record<string, unknown>)[field.name] ?? "")) : ""]))); setOpen(true); }
  async function save(event: FormEvent) { event.preventDefault(); setBusy(true); setFormError(""); setFieldErrors({}); try {
    const activeFields = fields.filter((field) => (!field.createOnly || !editing) && (!field.editOnly || editing) && (!field.visibleWhen || values[field.visibleWhen.field] === field.visibleWhen.value));
    const missing = activeFields.find((field) => (field.required || (field.requiredWhen && values[field.requiredWhen.field] === field.requiredWhen.value)) && (!values[field.name] || !values[field.name].trim()));
    if (missing) { setFieldErrors({ [missing.name]: `${missing.label} is required.` }); setBusy(false); return; }
    const invalidLength = activeFields.find((field) => field.minLength !== undefined && (values[field.name] ?? "").trim().length < field.minLength);
    if (invalidLength) { setFieldErrors({ [invalidLength.name]: `${invalidLength.label} must contain at least ${invalidLength.minLength} characters.` }); setBusy(false); return; }
    const invalidNumber = activeFields.find((field) => field.type === "number" && values[field.name] !== "" && (!Number.isFinite(Number(values[field.name])) || (field.min !== undefined && Number(values[field.name]) < field.min) || (field.max !== undefined && Number(values[field.name]) > field.max)));
    if (invalidNumber) { setFieldErrors({ [invalidNumber.name]: `${invalidNumber.label} is outside the allowed range.` }); setBusy(false); return; }
    const payload = makePayload ? makePayload(values, Boolean(editing)) : values;
    if (editing) await apiPatch(`${writeEndpoint}/${editing.id}`, payload); else await apiPost(writeEndpoint, payload);
    setOpen(false);
    setValues({});
    const refreshed = await reload();
    setMessage(refreshed.ok ? (editing ? "Changes saved." : "Record created.") : `${editing ? "Changes saved" : "Record created"}, but the list could not refresh: ${refreshed.error}`);
  } catch (cause) {
    if (!editing && values.initialPassword) setValues((current) => ({ ...current, initialPassword: "" }));
    if (cause instanceof ApiError && cause.details.length) {
      const mapped: Record<string, string> = {};
      for (const detail of cause.details) {
        const field = fields.find((candidate) => detail.message.toLowerCase().startsWith(`${candidate.name.toLowerCase()} `));
        if (field) mapped[field.name] = detail.message;
      }
      setFieldErrors(mapped);
    }
    setFormError(cause instanceof Error ? cause.message : "Save failed.");
  } finally { setBusy(false); } }
  async function linkAccount(event: FormEvent) { event.preventDefault(); if (!accountLink || !linkTarget) return; setBusy(true); setLinkError(""); try {
    if (!linkValues.accountMode) throw new Error("Choose whether to create or link an account.");
    if (linkValues.accountMode === "CREATE" && (!linkValues.email.trim() || linkValues.initialPassword.length < 14)) throw new Error("Enter an email and a temporary password of at least 14 characters.");
    if (linkValues.accountMode === "LINK" && !linkValues.userId) throw new Error("Choose an active unlinked account.");
    const payload = linkValues.accountMode === "CREATE" ? { accountMode: "CREATE", email: linkValues.email.trim(), initialPassword: linkValues.initialPassword } : { accountMode: "LINK", userId: linkValues.userId };
    await apiPost(accountLink.endpointFor(linkTarget), payload);
    setLinkTarget(null); setLinkValues({ accountMode: "", email: "", initialPassword: "", userId: "" });
    const refreshed = await reload(); setMessage(refreshed.ok ? "Account linked." : `Account linked, but the list could not refresh: ${refreshed.error}`);
  } catch (cause) { setLinkError(cause instanceof Error ? cause.message : "Could not link account."); setLinkValues(current=>({...current,initialPassword:""})); } finally { setBusy(false); } }
  async function remove(row: T) { if (!window.confirm(`Deactivate/archive this ${title.toLowerCase()} record?`)) return; setBusy(true); setMessage(""); try { await apiDelete(`${writeEndpoint}/${row.id}`); const refreshed = await reload(); setMessage(refreshed.ok ? "Record updated." : `Record updated, but the list could not refresh: ${refreshed.error}`); } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Update failed."); } finally { setBusy(false); } }

  return <div className="space-y-4">
    <PageHeader title={title} description={description} actions={<Button onClick={() => begin()}><Plus className="h-4 w-4" />Add {title.toLowerCase().replace(/s$/, "")}</Button>} />
    {message ? <p role="status" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">{message}</p> : null}
    <Input label="Search loaded records" value={query} onChange={(event) => setQuery(event.target.value)} />
    {loading ? <LoadingState label={`Loading ${title.toLowerCase()}`} /> : error ? <ErrorState description={error} onRetry={() => void reload()} /> : visible.length === 0 ? <Card><EmptyState title={`No ${title.toLowerCase()} found`} description="Records from the database will appear here. Use Add to create a record." /></Card> : <Card><div className="overflow-x-auto"><Table><THead><TR>{columns.map((column) => column.sortValue ? <SortableHeader key={column.label} label={column.label} column={column.label} sortKey={sortKey} direction={sortDirection} onSort={changeSort} /> : <TH key={column.label}>{column.label}</TH>)}<TH>Actions</TH></TR></THead><TBody>{pagination.pagedItems.map((row) => <TR key={row.id}>{columns.map((column) => <TD key={column.label}>{column.value(row)}</TD>)}<TD><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => begin(row)}>Edit</Button>{accountLink&&!accountLink.linked(row)?<Button size="sm" variant="outline" onClick={()=>{setLinkTarget(row);setLinkError("");setLinkValues({accountMode:"",email:"",initialPassword:"",userId:""});}}>Link account</Button>:null}<Button size="sm" variant="ghost" className="text-danger" disabled={busy} onClick={() => void remove(row)}>{deactivate ? "Deactivate" : "Archive"}</Button></div></TD></TR>)}</TBody></Table></div><Pagination page={pagination.page} pageCount={pagination.pageCount} pageSize={pagination.pageSize} total={pagination.total} onPageChange={pagination.setPage} /></Card>}
    <Dialog open={open} title={`${editing ? "Edit" : "Add"} ${title.toLowerCase().replace(/s$/, "")}`} onClose={() => { setOpen(false); setValues({}); }}>
      <form className="space-y-3" onSubmit={(event) => void save(event)}>{formError ? <p role="alert" className="text-sm text-danger">{formError}</p> : null}
        {fields.filter((field) => (!field.createOnly || !editing) && (!field.editOnly || editing) && (!field.visibleWhen || values[field.visibleWhen.field] === field.visibleWhen.value)).map((field) => field.type === "select" ? <div key={field.name}><Select id={`crud-${field.name}`} label={field.label} hint={field.hint} value={values[field.name] ?? ""} required={field.required || (field.requiredWhen ? values[field.requiredWhen.field] === field.requiredWhen.value : false)} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} options={[{ label: `Select ${field.label.toLowerCase()}`, value: "" }, ...(field.options ?? [])]} />{fieldErrors[field.name]?<p role="alert" className="mt-1 text-xs text-danger">{fieldErrors[field.name]}</p>:null}</div> : <Input key={field.name} id={`crud-${field.name}`} label={field.label} hint={field.hint} type={field.type ?? "text"} required={field.required || (field.requiredWhen ? values[field.requiredWhen.field] === field.requiredWhen.value : false)} min={field.min} max={field.max} step={field.step} minLength={field.minLength} maxLength={field.maxLength} value={values[field.name] ?? ""} error={fieldErrors[field.name]} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} />)}
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => { setOpen(false); setValues({}); }}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button></div>
      </form>
    </Dialog>
    {accountLink&&linkTarget?<Dialog open title={`Link ${accountLink.roleLabel} account`} onClose={()=>{setLinkTarget(null);setLinkValues({accountMode:"",email:"",initialPassword:"",userId:""});}}><form className="space-y-3" onSubmit={(event)=>void linkAccount(event)}>{linkError?<p role="alert" className="text-sm text-danger">{linkError}</p>:null}<Select label="Account setup" required value={linkValues.accountMode} onChange={(event)=>setLinkValues(current=>({...current,accountMode:event.target.value as ""|"CREATE"|"LINK",email:"",initialPassword:"",userId:""}))} options={[{label:"Choose setup method",value:""},{label:"Create account (local development only)",value:"CREATE"},{label:"Link existing active account",value:"LINK"}]}/>{linkValues.accountMode==="CREATE"?<><Input label="Login email" type="email" required value={linkValues.email} onChange={(event)=>setLinkValues(current=>({...current,email:event.target.value}))}/><Input label="Temporary setup password" type="password" required minLength={14} maxLength={128} hint="Development only. Passwords are never returned or emailed. No invitation/reset flow is configured." value={linkValues.initialPassword} onChange={(event)=>setLinkValues(current=>({...current,initialPassword:event.target.value}))}/><p className="text-xs text-amber-800">Direct password setup is disabled in production. Use only a temporary local-development credential.</p></>:null}{linkValues.accountMode==="LINK"?<Select label="Active unlinked account" required value={linkValues.userId} onChange={(event)=>setLinkValues(current=>({...current,userId:event.target.value}))} options={[{label:"Select an account",value:""},...accountLink.users.map(user=>({label:`${user.name} · ${user.email}`,value:user.id}))]}/>:null}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=>{setLinkTarget(null);setLinkValues({accountMode:"",email:"",initialPassword:"",userId:""});}}>Cancel</Button><Button type="submit" disabled={busy||!linkValues.accountMode}>{busy?"Linking…":"Link account"}</Button></div></form></Dialog>:null}
  </div>;
}
