"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoNotice } from "@/components/ui/demo-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { Feedback } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { usePagination } from "@/hooks/use-pagination";
import {
  RECORD_IMPORT_TEMPLATE,
  buildRecordImport,
  downloadCsv,
  parseCsv,
  type ImportPreviewRow,
} from "@/lib/csv";
import { recordRows } from "@/lib/selectors";
import { importRecords, useAdminState } from "@/lib/store";
import { includesQuery, selectedOrAll, semesterOptions } from "@/lib/utils";
import { isRecordInput } from "@/lib/validation";
import { useMemo, useState } from "react";

export function RecordsView() {
  const state = useAdminState();
  const rows = recordRows(state);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [semester, setSemester] = useState("all");
  const [reading, setReading] = useState(false);
  const [importError, setImportError] = useState("");
  const [preview, setPreview] = useState<ImportPreviewRow[] | null>(null);
  const [message, setMessage] = useState("");
  const departmentId = selectedOrAll(department, state.departments.map((item) => item.id));

  const filtered = useMemo(
    () =>
      rows.filter((record) => {
        const matchesQuery = includesQuery(query, [
          record.studentName,
          record.publicStudentId,
          record.courseName,
          record.courseCode,
        ]);
        const matchesDepartment = departmentId === "all" || record.departmentId === departmentId;
        const matchesSemester = semester === "all" || record.semester === Number(semester);
        return matchesQuery && matchesDepartment && matchesSemester;
      }),
    [rows, query, departmentId, semester],
  );
  const pagination = usePagination(filtered, state.settings.system.pageSize);
  const validRows = preview?.filter((row) => isRecordInput(row.record)) ?? [];

  async function onFile(file: File | undefined) {
    setMessage("");
    setImportError("");
    setPreview(null);
    if (!file) return;
    const type = file.type.toLowerCase();
    const csvType = type === "" || type === "text/csv" || type === "application/vnd.ms-excel";
    if (!file.name.toLowerCase().endsWith(".csv") || !csvType) {
      setImportError("Only CSV files can be imported in this demonstration.");
      return;
    }
    if (file.size > 1_000_000) {
      setImportError("The file is larger than 1 MB.");
      return;
    }
    setReading(true);
    try {
      const text = await file.text();
      const result = buildRecordImport(text, state);
      if (result.error) setImportError(result.error);
      else setPreview(result.rows);
    } catch {
      setImportError("The file could not be read.");
    } finally {
      setReading(false);
    }
  }

  function downloadTemplate() {
    const saved = downloadCsv("academic-records-template.csv", parseCsv(RECORD_IMPORT_TEMPLATE));
    setMessage(
      saved
        ? "Downloaded academic-records-template.csv."
        : "The template download could not be started.",
    );
  }

  function acceptImport() {
    const records = validRows.flatMap((row) => (row.record ? [row.record] : []));
    const result = importRecords(records);
    if (!result.ok) {
      setImportError(result.message);
      return;
    }
    const skipped = (preview?.length ?? 0) - records.length;
    setPreview(null);
    setMessage(
      skipped > 0
        ? `Imported ${records.length} valid row${records.length === 1 ? "" : "s"} into this demonstration session. ${skipped} row${skipped === 1 ? " was" : "s were"} skipped. Nothing was written to a database.`
        : `Imported ${records.length} row${records.length === 1 ? "" : "s"} into this demonstration session. Nothing was written to a database.`,
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Academic records"
        description="Attendance and assessment marks linked to students and courses in this session."
        actions={<Button variant="outline" onClick={downloadTemplate}>Download CSV template</Button>}
      />
      <Feedback message={message} />
      <DemoNotice>
        CSV import updates this browser session only. The sample template row will update Rahim Ahmed&apos;s Data Structures record if you accept the preview.
      </DemoNotice>
      <Card>
        <CardHeader>
          <CardTitle>Import CSV</CardTitle>
          <CardDescription>
            Required columns: student_id, course_code, attendance, assignment, quiz, midterm, final, semester.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            type="file"
            accept=".csv,text/csv"
            aria-label="CSV file"
            className="block w-full text-sm text-slate-600 file:mr-3 file:h-10 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:text-sm file:font-medium file:text-white"
            onChange={(event) => {
              const file = event.target.files?.[0];
              void onFile(file);
              event.target.value = "";
            }}
          />
          {importError ? <p role="alert" className="text-sm text-danger">{importError}</p> : null}
          {reading ? <LoadingState label="Reading CSV file" /> : null}
          {preview ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                {validRows.length} valid of {preview.length} rows. Review the preview before accepting.
              </p>
              <div className="max-h-80 overflow-auto rounded-md border border-slate-200">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      {["Line", "Student", "Course", "Marks", "Semester", "Result"].map((heading) => (
                        <th key={heading} className="px-3 py-2 font-medium">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.map((row) => (
                      <tr key={`${row.line}-${row.studentLabel}-${row.courseLabel}`}>
                        <td className="px-3 py-2">{row.line}</td>
                        <td className="px-3 py-2">{row.studentLabel || "—"}</td>
                        <td className="px-3 py-2">{row.courseLabel || "—"}</td>
                        <td className="px-3 py-2">{row.attendance}/{row.assignment}/{row.quiz}/{row.midterm}/{row.finalMark}</td>
                        <td className="px-3 py-2">{row.semester}</td>
                        <td className="px-3 py-2">
                          {row.errors.length > 0 ? (
                            <span className="text-danger">{row.errors.join(" ")}</span>
                          ) : (
                            <Badge variant={row.mode === "update" ? "warning" : "success"}>
                              {row.mode === "update" ? "Will update" : "Will add"}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={acceptImport} disabled={validRows.length === 0}>
                  Accept {validRows.length} valid row{validRows.length === 1 ? "" : "s"}
                </Button>
                <Button variant="outline" onClick={() => setPreview(null)}>Discard preview</Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input id="record-search" label="Search" placeholder="Student or course" value={query} onChange={(event) => { setQuery(event.target.value); pagination.setPage(1); }} />
          <Select id="record-department" label="Department" value={departmentId} onChange={(event) => { setDepartment(event.target.value); pagination.setPage(1); }} options={[{ label: "All departments", value: "all" }, ...state.departments.map((item) => ({ label: item.code, value: item.id }))]} />
          <Select id="record-semester" label="Semester" value={semester} onChange={(event) => { setSemester(event.target.value); pagination.setPage(1); }} options={semesterOptions(true)} />
        </div>
      </Card>
      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No academic records match" description="Adjust the filters or import a CSV preview." />
        ) : (
          <>
            <div className="hidden lg:block">
              <Table className="min-w-[980px]">
                <caption className="sr-only">Academic records</caption>
                <THead>
                  <TR>
                    <TH>Student</TH><TH>Course</TH><TH>Attendance</TH><TH>Assignment</TH><TH>Quiz</TH><TH>Midterm</TH><TH>Final</TH><TH>Semester</TH>
                  </TR>
                </THead>
                <TBody>
                  {pagination.pagedItems.map((record) => (
                    <TR key={record.id}>
                      <TD>
                        <p className="font-medium text-slate-900">{record.studentName}</p>
                        <p className="text-xs text-slate-500">{record.publicStudentId}</p>
                      </TD>
                      <TD>
                        <p>{record.courseName}</p>
                        <p className="text-xs text-slate-500">{record.courseCode}</p>
                      </TD>
                      <TD>{record.attendance}</TD>
                      <TD>{record.assignment}</TD>
                      <TD>{record.quiz}</TD>
                      <TD>{record.midterm}</TD>
                      <TD>{record.finalMark}</TD>
                      <TD>{record.semester}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            <div className="space-y-3 p-4 lg:hidden">
              {pagination.pagedItems.map((record) => (
                <article key={record.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <p className="font-medium text-slate-900">{record.studentName}</p>
                  <p className="text-xs text-slate-500">{record.publicStudentId} · {record.courseCode} · Semester {record.semester}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div><dt>Attendance</dt><dd className="font-medium text-slate-900">{record.attendance}</dd></div>
                    <div><dt>Assignment</dt><dd className="font-medium text-slate-900">{record.assignment}</dd></div>
                    <div><dt>Quiz</dt><dd className="font-medium text-slate-900">{record.quiz}</dd></div>
                    <div><dt>Midterm</dt><dd className="font-medium text-slate-900">{record.midterm}</dd></div>
                    <div><dt>Final</dt><dd className="font-medium text-slate-900">{record.finalMark}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
            <Pagination {...pagination} onPageChange={pagination.setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
