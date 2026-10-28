"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { apiDownload } from "@/lib/api";
import { countCsvDataRows, downloadBlob, downloadCsv } from "@/lib/csv";
import { useApiList } from "@/lib/use-api-list";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";

interface Student { id:string; studentNumber:string; name:string; email:string|null; department:{code:string;name:string}; enrollmentYear:number; status:string; }
interface Teacher { id:string; employeeNumber:string; name:string; email:string|null; department:{code:string;name:string}; status:string; }
interface Department { id:string; code:string; name:string; _count:{students:number;teachers:number;courses:number}; }
interface Term { id:string; code:string; label:string; }
type ExportKind="students"|"teachers"|"departments"|"academic-records";

export function ReportsView() {
  const students=useApiList<Student>("/students?page=1&pageSize=100");
  const teachers=useApiList<Teacher>("/teachers?page=1&pageSize=100");
  const departments=useApiList<Department>("/departments");
  const terms=useApiList<Term>("/terms?page=1&pageSize=100");
  const [kind,setKind]=useState<ExportKind>("students");
  const [termId,setTermId]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const loading=students.loading||teachers.loading||departments.loading||terms.loading;
  const loadError=students.error||teachers.error||departments.error||terms.error;
  const rows=useMemo(()=>kind==="students"?students.items.map((r)=>[r.studentNumber,r.name,r.email??"",r.department.code,String(r.enrollmentYear),r.status]):kind==="teachers"?teachers.items.map((r)=>[r.employeeNumber,r.name,r.email??"",r.department.code,r.status]):departments.items.map((r)=>[r.code,r.name,String(r._count.students),String(r._count.teachers),String(r._count.courses)]),[kind,students.items,teachers.items,departments.items]);
  const headers=kind==="students"?["student_number","name","email","department_code","enrollment_year","status"]:kind==="teachers"?["employee_number","name","email","department_code","status"]:["department_code","department_name","student_count","teacher_count","course_count"];

  async function exportCsv() {
    setBusy(true); setError(""); setMessage("");
    try {
      if (kind==="academic-records") {
        const result=await apiDownload(`/reports/academic-records.csv${termId?`?termId=${encodeURIComponent(termId)}`:""}`);
        const count=countCsvDataRows(await result.blob.text());
        if(!downloadBlob(result.filename,result.blob)) throw new Error("The browser could not start the download.");
        setMessage(`Downloaded ${result.filename} with ${count} data rows from the backend export. The endpoint rejects exports over 5,000 rows; choose a term to narrow a larger report.`);
      } else {
        if(!rows.length) { setMessage("No database records are available to export."); return; }
        const name=`academic-sentinel-${kind}.csv`;
        setMessage(downloadCsv(name,[headers,...rows])?`Downloaded ${name} with ${rows.length} data rows from all loaded API pages.`:"The browser could not start the export.");
      }
    } catch(cause) { setError(cause instanceof Error?cause.message:"Unable to export report."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-4">
    <PageHeader title="Reports" description="Directory exports use all API pages. Academic records use the backend CSV export and its 5,000-row safety limit." actions={<Button onClick={()=>void exportCsv()} disabled={busy||loading||Boolean(loadError)||(kind!=="academic-records"&&rows.length===0)}><Download className="h-4 w-4"/>{busy?"Preparing…":"Export CSV"}</Button>}/>
    <Card className="grid gap-4 p-4 sm:grid-cols-2">
      <Select label="Database export" value={kind} onChange={(event)=>{setKind(event.target.value as ExportKind);setMessage("");setError("");}} options={[{label:"Student directory",value:"students"},{label:"Teacher directory",value:"teachers"},{label:"Department counts",value:"departments"},{label:"Academic records (API CSV)",value:"academic-records"}]}/>
      {kind==="academic-records"?<Select label="Term filter (optional)" value={termId} onChange={(event)=>setTermId(event.target.value)} options={[{label:"All terms (up to 5,000 rows)",value:""},...terms.items.map((term)=>({label:`${term.code} · ${term.label}`,value:term.id}))]}/>:null}
    </Card>
    {message?<p role="status" className="text-sm text-slate-600">{message}</p>:null}
    {error?<p role="alert" className="text-sm text-danger">{error}</p>:null}
    {loading?<LoadingState label="Loading report filters and export records"/>:loadError?<ErrorState description={loadError} onRetry={()=>{void students.reload();void teachers.reload();void departments.reload();void terms.reload();}}/>:kind==="academic-records"?<Card className="p-4 text-sm text-slate-600">The API assembles attendance and assessment-score rows from PostgreSQL. Without a term filter, exports larger than 5,000 total rows are rejected with a validation error; select a term to narrow the export.</Card>:rows.length===0?<Card><EmptyState title="No rows to export" description="The selected database collection contains no records."/></Card>:<Card><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{headers.map((header)=><th key={header} className="px-4 py-3">{header}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr key={index} className="border-t">{row.map((cell,col)=><td key={headers[col]} className="px-4 py-3">{cell}</td>)}</tr>)}</tbody></table></div></Card>}
  </div>;
}
