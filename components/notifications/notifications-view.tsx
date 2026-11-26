"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useNotificationSocket } from "@/hooks/use-notification-socket";
import { apiPatch, apiPost, apiRequest } from "@/lib/api";
import { useApiList } from "@/lib/use-api-list";
import { useEffect, useRef, useState, type FormEvent } from "react";

interface Notification { id:string; title:string; message:string; readAt:string|null; createdAt:string; alertId:string|null; }
interface Recipient { id:string; name:string; email:string; role:string; status:string; }
interface EmailDelivery { id:string; status:string; attemptCount:number; providerMessageId:string|null; lastErrorCode:string|null; acceptedAt:string|null; }
interface SendResult { notification:Notification & {inAppVisible:boolean}; emailDelivery:EmailDelivery; duplicate?:boolean; }
interface DeliveryRow extends EmailDelivery { createdAt:string; updatedAt?:string; notification:{id:string;title:string;recipient:{name:string;email:string}}; }
interface EmailControls {
  emailPolicyApproved:boolean;
  smtpEnabled:boolean;
  workerEnabled:boolean;
  workerAutoRetry:boolean;
  automatedRiskAlertEmailEnabled:boolean;
  testEmailEnabled?:boolean;
  testRecipientCount?:number;
  testRecipientsMasked?:string[];
  emailProvider?:string;
  disclaimer:string;
}
interface DeliveryLog { id:string; action:string; changes:Record<string,unknown>|null; createdAt:string; }

function deliveryMessage(result:SendResult) {
  const duplicate=result.duplicate?"Duplicate Idempotency-Key reused; no second send was attempted. ":"";
  const inApp=result.notification.inAppVisible?"In-app message saved.":"In-app delivery skipped by recipient preference.";
  const email=result.emailDelivery.status==="SMTP_ACCEPTED"
    ?"SMTP provider accepted the message; inbox delivery was not verified."
    :result.emailDelivery.status==="SKIPPED_DISABLED"?"Email was not attempted because SMTP is disabled."
    :result.emailDelivery.status==="SUPPRESSED_PREFERENCE"?"Email was not attempted because the recipient has not opted in."
    :result.emailDelivery.status==="PENDING"?"Email remains queued for the background worker."
    :`Email was not accepted (${result.emailDelivery.status.toLowerCase()}${result.emailDelivery.lastErrorCode?`: ${result.emailDelivery.lastErrorCode}`:""}).`;
  return `${duplicate}${inApp} ${email}`;
}

export function NotificationsView() {
  const [inboxFilter,setInboxFilter]=useState<"all"|"unread">("all");
  const inboxPath=inboxFilter==="unread"?"/notifications?unread=true&page=1&pageSize=100":"/notifications?page=1&pageSize=100";
  const {items,loading,error,reload}=useApiList<Notification>(inboxPath);
  const {items:users,loading:usersLoading,error:usersError,reload:reloadUsers}=useApiList<Recipient>("/users?page=1&pageSize=100");
  const [deliveryStatus,setDeliveryStatus]=useState("");
  const deliveryPath=deliveryStatus
    ?`/notifications/email-deliveries?page=1&pageSize=100&status=${encodeURIComponent(deliveryStatus)}`
    :"/notifications/email-deliveries?page=1&pageSize=100";
  const {items:deliveries,loading:deliveriesLoading,error:deliveriesError,reload:reloadDeliveries}=useApiList<DeliveryRow>(deliveryPath);
  const [recipientId,setRecipientId]=useState("");
  const [title,setTitle]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const [feedback,setFeedback]=useState("");
  const [actionError,setActionError]=useState("");
  const [controls,setControls]=useState<EmailControls|null>(null);
  const [controlsError,setControlsError]=useState("");
  const [logRows,setLogRows]=useState<DeliveryLog[]>([]);
  const [logFor,setLogFor]=useState<string|null>(null);
  const [testTo,setTestTo]=useState("");
  const [testSubject,setTestSubject]=useState("Academic Sentinel test email");
  const [testMessage,setTestMessage]=useState("Controlled test email to an allowlisted recipient only. Not a student risk alert.");
  const pendingKey=useRef<string|null>(null);
  const testKey=useRef<string|null>(null);
  const unread=items.filter((item)=>!item.readAt).length;

  useEffect(() => {
    let cancelled=false;
    void (async () => {
      try {
        const response=await apiRequest<EmailControls>("/notifications/email/controls");
        if(!cancelled){setControls(response.data);setControlsError("");}
      } catch(cause) {
        if(!cancelled)setControlsError(cause instanceof Error?cause.message:"Unable to load email controls.");
      }
    })();
    return () => { cancelled=true; };
  }, []);

  useNotificationSocket({
    enabled: true,
    onEvent: (event) => {
      if (inboxFilter === "unread" && event.readAt) return;
      void reload();
    },
    onReconnectSync: () => { void reload(); },
  });

  async function update(path:string,body?:unknown) {
    if(busy)return;
    setBusy(true);setActionError("");setFeedback("");
    try {
      if(body===undefined)await apiPost(path,{});else await apiPatch(path,body);
      const refreshed=await reload();
      setFeedback(refreshed.ok?"Notification state updated.":`Notification state updated, but the list could not refresh: ${refreshed.error}`);
    } catch(cause) { setActionError(cause instanceof Error?cause.message:"Unable to update notification."); }
    finally { setBusy(false); }
  }

  async function send(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();if(busy)return;
    pendingKey.current??=crypto.randomUUID();
    setBusy(true);setFeedback("");setActionError("");
    try {
      const response=await apiRequest<SendResult>("/notifications",{method:"POST",headers:{"Idempotency-Key":pendingKey.current},body:JSON.stringify({recipientId,title:title.trim(),message:message.trim()})});
      pendingKey.current=null;
      setTitle("");setMessage("");
      const [refreshed,deliveryRefresh]=await Promise.all([reload(),reloadDeliveries()]);
      const refreshErrors=[!refreshed.ok?`recipient list: ${refreshed.error}`:"",!deliveryRefresh.ok?`email history: ${deliveryRefresh.error}`:""].filter(Boolean);
      setFeedback(`${deliveryMessage(response.data)}${refreshErrors.length?` Refresh failed (${refreshErrors.join("; ")}).`:""}`);
    } catch(cause) { setActionError(cause instanceof Error?cause.message:"Unable to save notification."); }
    finally { setBusy(false); }
  }

  async function retryEmail(notificationId:string) {
    if(busy)return;
    setBusy(true);setFeedback("");setActionError("");
    try {
      const response=await apiPost<EmailDelivery>(`/notifications/${notificationId}/email/retry`,{});
      const refreshed=await reloadDeliveries();
      setFeedback(`${response.data.status==="SMTP_ACCEPTED"?"SMTP provider accepted the retry; inbox delivery was not verified.":`Email retry status: ${response.data.status.toLowerCase()}${response.data.lastErrorCode?` (${response.data.lastErrorCode})`:""}.`}${refreshed.ok?"":` Email history refresh failed: ${refreshed.error}`}`);
    } catch(cause) { setActionError(cause instanceof Error?cause.message:"Unable to retry email."); }
    finally { setBusy(false); }
  }

  async function loadLogs(notificationId:string) {
    if(busy)return;
    setBusy(true);setActionError("");
    try {
      const response=await apiRequest<DeliveryLog[]>(`/notifications/${notificationId}/email/logs?page=1&pageSize=50`);
      setLogFor(notificationId);
      setLogRows(response.data);
    } catch(cause) { setActionError(cause instanceof Error?cause.message:"Unable to load delivery logs."); }
    finally { setBusy(false); }
  }

  async function sendTestEmail(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();if(busy)return;
    testKey.current??=crypto.randomUUID();
    setBusy(true);setFeedback("");setActionError("");
    try {
      const response=await apiRequest<SendResult & {disclaimer?:string}>("/notifications/email/test",{
        method:"POST",
        headers:{"Idempotency-Key":testKey.current},
        body:JSON.stringify({to:testTo.trim(),subject:testSubject.trim(),message:testMessage.trim()}),
      });
      testKey.current=null;
      const refreshed=await reloadDeliveries();
      setFeedback(`${deliveryMessage(response.data)} ${response.data.disclaimer??""}${refreshed.ok?"":` Email history refresh failed: ${refreshed.error}`}`);
    } catch(cause) { setActionError(cause instanceof Error?cause.message:"Unable to send test email."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-4">
    <PageHeader title="Notifications" description="Recipient inbox and Admin-authored in-app messages. Realtime delivery supplements REST; history remains API-backed. Email is attempted only when the recipient opted in and server SMTP/Brevo is enabled; provider acceptance does not confirm inbox delivery. Automated ML risk-alert email remains disabled. Test emails only reach EMAIL_TEST_RECIPIENTS." actions={<Button variant="outline" disabled={!unread||busy} onClick={()=>void update("/notifications/read-all")}>Mark all read</Button>}/>
    <Card className="p-4 space-y-2">
      <h2 className="font-semibold">Email controls (server-side)</h2>
      {controlsError?<p role="alert" className="text-sm text-danger">{controlsError}</p>:null}
      {controls?<ul className="text-sm text-slate-700 space-y-1">
        <li>Policy approved: {controls.emailPolicyApproved?"yes":"no"}</li>
        <li>Transport enabled: {controls.smtpEnabled?"yes":"no"}{controls.emailProvider?` (${controls.emailProvider})`:""}</li>
        <li>Background worker: {controls.workerEnabled?"yes":"no"}{controls.workerAutoRetry?" (auto-retry on)":" (auto-retry off)"}</li>
        <li>Automated risk-alert email: {controls.automatedRiskAlertEmailEnabled?"yes":"disabled until university approval"}</li>
        <li>Test email: {controls.testEmailEnabled?"enabled":"disabled"} · allowlisted recipients: {controls.testRecipientCount??0}</li>
        {controls.testRecipientsMasked?.length?<li>Allowlist (masked): {controls.testRecipientsMasked.join(", ")}</li>:null}
        <li className="text-slate-500">{controls.disclaimer}</li>
      </ul>:<p className="text-sm text-slate-600">Loading controls…</p>}
    </Card>
    <Card className="p-4 space-y-3">
      <h2 className="font-semibold">Controlled test email</h2>
      <p className="text-sm text-slate-600">Sends only to emails listed in server EMAIL_TEST_RECIPIENTS. Never use this for synthetic risk alerts to students.</p>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event)=>void sendTestEmail(event)}>
        <Input label="Allowlisted recipient email" type="email" value={testTo} required onChange={(event)=>setTestTo(event.target.value)}/>
        <Input label="Subject" value={testSubject} maxLength={180} required onChange={(event)=>setTestSubject(event.target.value)}/>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">Message<textarea className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={testMessage} maxLength={1000} required onChange={(event)=>setTestMessage(event.target.value)}/></label>
        <div className="sm:col-span-2"><Button type="submit" disabled={busy||!controls?.testEmailEnabled||!testTo.trim()}>{busy?"Sending…":"Send test email"}</Button></div>
      </form>
    </Card>
    <Card className="p-4"><h2 className="mb-3 font-semibold">Send a manual message</h2><form className="grid gap-3 sm:grid-cols-2" onSubmit={(event)=>void send(event)}>
      {usersLoading?<p className="text-sm">Loading recipients…</p>:usersError?<div role="alert" className="sm:col-span-2"><ErrorState description={usersError} onRetry={()=>void reloadUsers()}/></div>:<Select label="Recipient" value={recipientId} onChange={(event)=>setRecipientId(event.target.value)} required options={[{label:"Select a recipient",value:""},...users.filter((user)=>user.status==="ACTIVE").map((user)=>({label:`${user.name} · ${user.role} · ${user.email}`,value:user.id}))]}/>}
      <Input label="Title" value={title} maxLength={180} required onChange={(event)=>setTitle(event.target.value)}/>
      <label className="text-sm font-medium text-slate-700 sm:col-span-2">Message<textarea className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={message} maxLength={1000} required onChange={(event)=>setMessage(event.target.value)}/></label>
      <div className="sm:col-span-2"><Button type="submit" disabled={busy||usersLoading||Boolean(usersError)||!recipientId||!title.trim()||!message.trim()}>{busy?"Processing…":"Save manual message"}</Button></div>
    </form>
    {feedback?<p role="status" className="mt-3 text-sm">{feedback}</p>:null}{actionError?<p role="alert" className="mt-3 text-sm text-danger">{actionError}</p>:null}
    </Card>
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Manual message email history</h2>
          <p className="text-sm text-slate-600">SMTP accepted means the provider accepted the message for processing; it does not confirm recipient inbox delivery.</p>
        </div>
        <Select label="Status filter" value={deliveryStatus} onChange={(event)=>setDeliveryStatus(event.target.value)} options={[
          {label:"All statuses",value:""},
          {label:"PENDING",value:"PENDING"},
          {label:"SENDING",value:"SENDING"},
          {label:"SMTP_ACCEPTED",value:"SMTP_ACCEPTED"},
          {label:"FAILED",value:"FAILED"},
          {label:"SUPPRESSED_PREFERENCE",value:"SUPPRESSED_PREFERENCE"},
          {label:"SKIPPED_DISABLED",value:"SKIPPED_DISABLED"},
        ]}/>
      </div>
      {deliveriesLoading?<LoadingState label="Loading email delivery status"/>:deliveriesError?<ErrorState description={deliveriesError} onRetry={()=>void reloadDeliveries()}/>:deliveries.length===0?<Card><EmptyState title="No email attempts" description="Manual message email attempts will appear here, including preference and configuration skips."/></Card>:<div className="space-y-2">{deliveries.map((row)=><Card key={row.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{row.notification.title} · {row.notification.recipient.name}</p><p className="text-sm text-slate-600">{row.status} · {row.attemptCount} attempt(s){row.lastErrorCode?` · ${row.lastErrorCode}`:""} · {new Date(row.createdAt).toLocaleString()}</p>{row.status==="SMTP_ACCEPTED"&&row.providerMessageId?<p className="text-xs text-slate-500">SMTP message ID: {row.providerMessageId}; inbox delivery is unverified.</p>:null}</div><div className="flex gap-2">{row.status==="FAILED"?<Button size="sm" variant="outline" disabled={busy} onClick={()=>void retryEmail(row.notification.id)}>Retry email</Button>:null}<Button size="sm" variant="outline" disabled={busy} onClick={()=>void loadLogs(row.notification.id)}>Logs</Button></div></Card>)}</div>}
      {logFor?<Card className="p-4 space-y-2"><div className="flex items-center justify-between"><h3 className="font-medium">Delivery logs · {logFor}</h3><Button size="sm" variant="outline" onClick={()=>{setLogFor(null);setLogRows([]);}}>Close</Button></div>{logRows.length===0?<p className="text-sm text-slate-600">No structured delivery logs for this notification.</p>:<ul className="space-y-1 text-sm">{logRows.map((log)=><li key={log.id}><span className="font-medium">{log.action}</span> · {new Date(log.createdAt).toLocaleString()}</li>)}</ul>}</Card>:null}
    </section>
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-lg font-semibold">In-app inbox</h2>
        <Select label="Inbox filter" value={inboxFilter} onChange={(event)=>setInboxFilter(event.target.value as "all"|"unread")} options={[{label:"All",value:"all"},{label:"Unread only",value:"unread"}]}/>
      </div>
      {loading?<LoadingState label="Loading notifications"/>:error?<ErrorState description={error} onRetry={()=>void reload()}/>:items.length===0?<Card><EmptyState title="No notifications" description="No notifications are currently visible in this account's inbox."/></Card>:<div className="space-y-3">{items.map((item)=><Card key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-medium text-slate-900">{item.title}{!item.readAt?<span className="ml-2 rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">Unread</span>:null}</p><p className="mt-1 text-sm text-slate-600">{item.message}</p><p className="mt-2 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}{item.alertId?` · Alert ${item.alertId}`:""}</p></div>{!item.readAt?<Button size="sm" variant="outline" disabled={busy} onClick={()=>void update(`/notifications/${item.id}/read`,{})}>Mark read</Button>:null}</Card>)}</div>}
    </section>
  </div>;
}
