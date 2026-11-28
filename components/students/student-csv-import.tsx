"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import { useState } from "react";

interface Preview {
  jobId: string;
  totalRows: number;
  validRows: number;
  errorCount: number;
  rows: { line: number; valid: boolean; errors: string[] }[];
}

export function StudentCsvImport({ onCommitted }: { onCommitted?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [acknowledge, setAcknowledge] = useState(false);

  async function runPreview() {
    if (!file) return;
    setBusy(true);
    setError("");
    setMessage("");
    setAcknowledge(false);
    try {
      const csv = await file.text();
      const result = await apiRequest<Preview>("/imports/students/preview", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ csv }),
      });
      setPreview(result.data);
    } catch (cause) {
      setPreview(null);
      setError(cause instanceof Error ? cause.message : "Preview failed.");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!preview) return;
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest<{ committedRows: number; skippedInvalidRows: number }>(
        `/imports/students/${preview.jobId}/commit`,
        { method: "POST", body: JSON.stringify({ acknowledgeInvalidRows: acknowledge }) },
      );
      setMessage(`Committed ${result.data.committedRows} students; skipped ${result.data.skippedInvalidRows} invalid rows.`);
      setPreview(null);
      setFile(null);
      onCommitted?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Commit failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Student CSV import</CardTitle>
          <CardDescription>
            Required headers (same as Reports → Student directory export): student_number, name, email, department_code, enrollment_year, status.
            Creates academic profiles only — no login passwords. Department codes must already exist (for example CSE).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            id="student-csv-file"
            label="CSV file"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setPreview(null);
              setError("");
              setMessage("");
            }}
          />
          <Button disabled={!file || busy} onClick={() => void runPreview()}>
            {busy ? "Working…" : "Validate preview"}
          </Button>
          {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
          {message ? <p role="status" className="text-sm text-slate-700">{message}</p> : null}
        </CardContent>
      </Card>
      {preview ? (
        <Card>
          <CardHeader>
            <CardTitle>Server validation preview</CardTitle>
            <CardDescription>
              {preview.totalRows} rows · {preview.validRows} valid · {preview.errorCount} errors · job {preview.jobId}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className="py-2">Line</th>
                    <th>Status</th>
                    <th>Validation messages</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => (
                    <tr key={row.line} className="border-t">
                      <td className="py-2">{row.line}</td>
                      <td>{row.valid ? "Valid" : "Invalid"}</td>
                      <td>{row.errors.join("; ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.errorCount > 0 ? (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={acknowledge} onChange={(event) => setAcknowledge(event.target.checked)} />
                I acknowledge invalid rows will be skipped; only valid preview rows will be committed.
              </label>
            ) : null}
            <Button
              disabled={busy || preview.validRows === 0 || (preview.errorCount > 0 && !acknowledge)}
              onClick={() => void commit()}
            >
              Commit {preview.validRows} valid students
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
