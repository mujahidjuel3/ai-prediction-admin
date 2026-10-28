"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { apiPatch } from "@/lib/api";
import { useApiList } from "@/lib/use-api-list";
import { useState } from "react";

interface Alert { id:string; category:string; severity:string; reason:string; recommendation:string|null; status:string; createdAt:string; student:{id:string;studentNumber:string;name:string}; term:{label:string}; }
export function AlertsView() {
  const { items, loading, error, reload } = useApiList<Alert>("/alerts?page=1&pageSize=100");
  const [busyId,setBusyId]=useState(""); const [feedback,setFeedback]=useState(""); const [actionError,setActionError]=useState("");
  async function setStatus(alert:Alert,status:"ACKNOWLEDGED"|"RESOLVED") { if(busyId)return; setBusyId(alert.id);setFeedback("");setActionError("");try { await apiPatch(`/alerts/${alert.id}`,{status}); const result=await reload();setFeedback(result.ok?`Alert ${status.toLowerCase()}.`: `Alert ${status.toLowerCase()}, but the list could not refresh: ${result.error}`); } catch (cause) { setActionError(cause instanceof Error?cause.message:"Unable to update alert."); } finally { setBusyId(""); } }
  return <div className="space-y-4"><PageHeader title="Early Warning Alerts" description="Persisted alerts from the API. No risk scores or alert rules are inferred by this interface." />{feedback?<p role="status" className="text-sm">{feedback}</p>:null}{actionError?<p role="alert" className="text-sm text-danger">{actionError}</p>:null}{loading?<LoadingState label="Loading alerts"/>:error?<ErrorState description={error} onRetry={()=>void reload()}/>:items.length===0?<Card><EmptyState title="No stored alerts" description="No alerts are currently recorded in the database."/></Card>:<div className="space-y-3">{items.map((alert)=><Card key={alert.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-medium text-slate-900">{alert.student.name} · {alert.student.studentNumber}</p><p className="mt-1 text-sm text-slate-600">{alert.reason}</p><p className="mt-2 text-xs text-slate-500">{alert.term.label} · {alert.category} · {alert.severity} · {alert.status} · {new Date(alert.createdAt).toLocaleString()}</p>{alert.recommendation?<p className="mt-2 text-sm text-slate-600">{alert.recommendation}</p>:null}</div><div className="flex shrink-0 gap-2">{alert.status==="OPEN"?<Button size="sm" variant="outline" disabled={Boolean(busyId)} onClick={()=>void setStatus(alert,"ACKNOWLEDGED")}>Acknowledge</Button>:null}{alert.status!=="RESOLVED"?<Button size="sm" disabled={Boolean(busyId)} onClick={()=>void setStatus(alert,"RESOLVED")}>{busyId===alert.id?"Saving…":"Resolve"}</Button>:null}</div></Card>)}</div>}</div>;
}
