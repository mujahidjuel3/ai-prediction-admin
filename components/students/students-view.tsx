"use client";

import { StudentForm } from "@/components/students/student-form";
import { buttonClassName } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Feedback } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { PersonIdentity } from "@/components/ui/person-identity";
import { Select } from "@/components/ui/select";
import { ActiveBadge, RiskBadge } from "@/components/ui/status-badges";
import { SortableHeader } from "@/components/ui/sortable-header";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { usePagination } from "@/hooks/use-pagination";
import { RISK_RANK } from "@/lib/academics";
import { deleteStudent, useAdminState } from "@/lib/store";
import { studentRows, type StudentRow } from "@/lib/selectors";
import {
  compareValues,
  formatDate,
  formatGpa,
  formatPercent,
  includesQuery,
  RISK_OPTIONS,
  selectedOrAll,
  semesterOptions,
} from "@/lib/utils";
import type { SortDirection } from "@/types/common";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type SortKey = "name" | "studentId" | "department" | "gpa" | "attendance" | "risk" | "updated";

interface StudentsViewProps {
  initialQuery?: string;
  initialDepartment?: string;
  initialSemester?: string;
  initialRisk?: string;
}

function sortValue(student: StudentRow, key: SortKey): string | number {
  if (key === "name") return student.name;
  if (key === "studentId") return student.studentId;
  if (key === "department") return student.departmentName;
  if (key === "gpa") return student.gpa;
  if (key === "attendance") return student.attendance;
  if (key === "risk") return RISK_RANK[student.riskLevel];
  return student.lastUpdated;
}

export function StudentsView({
  initialQuery = "",
  initialDepartment = "all",
  initialSemester = "all",
  initialRisk = "all",
}: StudentsViewProps) {
  const state = useAdminState();
  const rows = studentRows(state);
  const [query, setQuery] = useState(initialQuery);
  const [department, setDepartment] = useState(initialDepartment);
  const [semester, setSemester] = useState(initialSemester);
  const [risk, setRisk] = useState(initialRisk);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [direction, setDirection] = useState<SortDirection>("asc");
  const [formStudent, setFormStudent] = useState<StudentRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<StudentRow | null>(null);
  const [message, setMessage] = useState("");

  const departmentId = selectedOrAll(department, state.departments.map((item) => item.id));
  const riskValue = selectedOrAll(risk, ["high", "medium", "low"]);
  const semesterValue = selectedOrAll(
    semester,
    ["1", "2", "3", "4", "5", "6", "7", "8"],
  );
  const filtered = useMemo(() => {
    const next = rows.filter((student) => {
      const matchesQuery = includesQuery(query, [student.name, student.studentId, student.email]);
      const matchesDepartment = departmentId === "all" || student.departmentId === departmentId;
      const matchesSemester = semesterValue === "all" || student.semester === Number(semesterValue);
      const matchesRisk = riskValue === "all" || student.riskLevel === riskValue;
      return matchesQuery && matchesDepartment && matchesSemester && matchesRisk;
    });
    return [...next].sort((left, right) =>
      compareValues(sortValue(left, sortKey), sortValue(right, sortKey), direction),
    );
  }, [rows, query, departmentId, semesterValue, riskValue, sortKey, direction]);

  const pagination = usePagination(filtered, state.settings.system.pageSize);

  function resetPage() {
    pagination.setPage(1);
  }

  function onSort(column: string) {
    const next = column as SortKey;
    if (sortKey === next) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(next);
      setDirection(next === "name" || next === "studentId" || next === "department" ? "asc" : "desc");
    }
    resetPage();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Students"
        description="Search the demonstration roster, review risk, and update records for this session."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add student
          </Button>
        }
      />
      <Feedback message={message} />
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input id="student-search" label="Search" placeholder="Name or student ID" value={query} onChange={(event) => { setQuery(event.target.value); resetPage(); }} />
          <Select id="student-department-filter" label="Department" value={departmentId} onChange={(event) => { setDepartment(event.target.value); resetPage(); }} options={[{ label: "All departments", value: "all" }, ...state.departments.map((item) => ({ label: item.code, value: item.id }))]} />
          <Select id="student-semester-filter" label="Semester" value={semesterValue} onChange={(event) => { setSemester(event.target.value); resetPage(); }} options={semesterOptions(true)} />
          <Select id="student-risk-filter" label="Risk" value={riskValue} onChange={(event) => { setRisk(event.target.value); resetPage(); }} options={RISK_OPTIONS} />
        </div>
      </Card>
      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No students match these filters" description="Adjust the search or filters, or add a student to this session." />
        ) : (
          <>
            <div className="hidden lg:block">
              <Table>
                <caption className="sr-only">Students</caption>
                <THead>
                  <TR>
                    <SortableHeader label="Student" column="name" sortKey={sortKey} direction={direction} onSort={onSort} />
                    <SortableHeader label="Student ID" column="studentId" sortKey={sortKey} direction={direction} onSort={onSort} />
                    <SortableHeader label="Department" column="department" sortKey={sortKey} direction={direction} onSort={onSort} />
                    <TH>Semester</TH>
                    <SortableHeader label="GPA" column="gpa" sortKey={sortKey} direction={direction} onSort={onSort} />
                    <SortableHeader label="Attendance" column="attendance" sortKey={sortKey} direction={direction} onSort={onSort} />
                    <SortableHeader label="Risk" column="risk" sortKey={sortKey} direction={direction} onSort={onSort} />
                    <SortableHeader label="Updated" column="updated" sortKey={sortKey} direction={direction} onSort={onSort} />
                    <TH>Actions</TH>
                  </TR>
                </THead>
                <TBody>
                  {pagination.pagedItems.map((student) => (
                    <TR key={student.id}>
                      <TD><PersonIdentity name={student.name} secondary={student.email} /></TD>
                      <TD>{student.studentId}</TD>
                      <TD>{student.departmentCode}</TD>
                      <TD>{student.semester}</TD>
                      <TD>{formatGpa(student.gpa)}</TD>
                      <TD>{formatPercent(student.attendance)}</TD>
                      <TD><RiskBadge level={student.riskLevel} /></TD>
                      <TD>{formatDate(student.lastUpdated)}</TD>
                      <TD>
                        <div className="flex gap-2">
                          <Link href={`/students/${student.id}`} className={buttonClassName("outline", "sm")}>View</Link>
                          <Button variant="outline" size="sm" onClick={() => setFormStudent(student)}>Edit</Button>
                          <Button variant="ghost" size="sm" className="text-danger" onClick={() => setPendingDelete(student)}>Delete</Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            <div className="space-y-3 p-4 lg:hidden">
              {pagination.pagedItems.map((student) => (
                <article key={student.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <PersonIdentity name={student.name} secondary={student.studentId} />
                    <RiskBadge level={student.riskLevel} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div><dt>Department</dt><dd className="font-medium text-slate-900">{student.departmentCode}</dd></div>
                    <div><dt>Semester</dt><dd className="font-medium text-slate-900">{student.semester}</dd></div>
                    <div><dt>GPA</dt><dd className="font-medium text-slate-900">{formatGpa(student.gpa)}</dd></div>
                    <div><dt>Attendance</dt><dd className="font-medium text-slate-900">{formatPercent(student.attendance)}</dd></div>
                    <div><dt>Status</dt><dd className="mt-1"><ActiveBadge status={student.enrollmentStatus} /></dd></div>
                    <div><dt>Updated</dt><dd className="font-medium text-slate-900">{formatDate(student.lastUpdated)}</dd></div>
                  </dl>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <Link href={`/students/${student.id}`} className={buttonClassName("outline", "sm")}>View</Link>
                    <Button variant="outline" size="sm" onClick={() => setFormStudent(student)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-danger" onClick={() => setPendingDelete(student)}>Delete</Button>
                  </div>
                </article>
              ))}
            </div>
            <Pagination {...pagination} onPageChange={pagination.setPage} />
          </>
        )}
      </Card>
      {creating ? (
        <StudentForm onClose={() => setCreating(false)} onSaved={setMessage} />
      ) : null}
      {formStudent ? (
        <StudentForm student={formStudent} onClose={() => setFormStudent(null)} onSaved={setMessage} />
      ) : null}
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete student"
        description={
          pendingDelete
            ? `Remove ${pendingDelete.name} from this demonstration session? Related course records, the sample prediction, and alerts for this student will also be removed.`
            : ""
        }
        confirmLabel="Delete student"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteStudent(pendingDelete.id);
          setMessage("Student removed from this demonstration session.");
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
