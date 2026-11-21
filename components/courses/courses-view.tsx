"use client";

import { ApiCrudView, type CrudColumn, type CrudField } from "@/components/data/api-crud-view";
import { useApiList } from "@/lib/use-api-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { useEffect, useState, type FormEvent } from "react";

interface Department { id: string; code: string; name: string; }
interface Course { id: string; code: string; name: string; departmentId: string; department: Department; credits: string | number; active: boolean; _count: { offerings: number }; }

export function CoursesView() {
  const { items: departments } = useApiList<Department>("/departments");
  const fields: CrudField<Course>[] = [
    { name: "code", label: "Course code", required: true, minLength: 2, maxLength: 32 },
    { name: "name", label: "Course name", required: true, minLength: 2, maxLength: 160 },
    { name: "departmentId", label: "Department", type: "select", required: true, value: (row) => row.departmentId, options: departments.map((d) => ({ label: `${d.code} · ${d.name}`, value: d.id })) },
    { name: "credits", label: "Credits", type: "number", required: true, min: 0.01, max: 100, step: 0.01 },
  ];
  const columns: CrudColumn<Course>[] = [
    { label: "Course code", value: (row) => <span className="font-medium text-slate-900">{row.code}</span>, sortValue: (row) => row.code },
    { label: "Course", value: (row) => row.name, sortValue: (row) => row.name },
    { label: "Department", value: (row) => `${row.department.code} · ${row.department.name}` },
    { label: "Credits", value: (row) => row.credits, sortValue: (row) => Number(row.credits) },
    { label: "Offerings", value: (row) => row._count.offerings, sortValue: (row) => row._count.offerings },
    { label: "Status", value: (row) => row.active ? "Active" : "Archived", sortValue: (row) => row.active ? 1 : 0 },
  ];
  return (
    <div className="space-y-8">
      <ApiCrudView
        title="Courses"
        description="Database course catalog. Term, section, and teacher assignments are managed separately as course offerings. CSV import remains available under Academic Records."
        endpoint="/courses/catalog?page=1&pageSize=100"
        writeEndpoint="/courses"
        fields={fields}
        columns={columns}
        makePayload={(v) => ({ code: v.code.trim(), name: v.name.trim(), departmentId: v.departmentId, credits: Number(v.credits) })}
      />
      <OfferingsPanel />
    </div>
  );
}

interface Term {
  id: string;
  code: string;
  label: string;
  academicYear: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
}
interface TeacherOption { id: string; name: string; status?: string; }
interface StudentOption { id: string; studentNumber: string; name: string; }
interface Offering {
  id: string;
  section: string;
  courseId?: string;
  termId?: string;
  teacherId?: string | null;
  course: { id?: string; code: string; name: string };
  term: { id?: string; label: string; code?: string };
  teacher: { id: string; name: string } | null;
  _count: { enrollments: number };
}
interface Enrollment { id: string; status: string; student: { id: string; studentNumber: string; name: string }; }

function OfferingsPanel() {
  const { items: courses } = useApiList<Course>("/courses/catalog?page=1&pageSize=100");
  const { items: terms, reload: reloadTerms } = useApiList<Term>("/terms?page=1&pageSize=100");
  const { items: teachers } = useApiList<TeacherOption>("/teachers?page=1&pageSize=100");
  const { items: students } = useApiList<StudentOption>("/students?page=1&pageSize=100&status=ACTIVE");
  const { items: offerings, loading, error, reload } = useApiList<Offering>("/courses");
  const [courseId, setCourseId] = useState("");
  const [termId, setTermId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [section, setSection] = useState("A");
  const [editingOfferingId, setEditingOfferingId] = useState<string | null>(null);
  const [selected, setSelected] = useState("");
  const [studentId, setStudentId] = useState("");
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [term, setTerm] = useState({ code: "", label: "", academicYear: "", startsAt: "", endsAt: "", active: false });

  useEffect(() => {
    if (!selected) return;
    const timer = window.setTimeout(() => {
      void apiGet<Enrollment[]>(`/offerings/${selected}/enrollments`)
        .then((result) => setEnrollments(result.data))
        .catch((cause) => setMessage(cause instanceof Error ? cause.message : "Unable to load enrollments."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selected]);

  function resetOfferingForm() {
    setEditingOfferingId(null);
    setCourseId("");
    setTermId("");
    setTeacherId("");
    setSection("A");
  }

  function beginEditOffering(offering: Offering) {
    setEditingOfferingId(offering.id);
    setCourseId(offering.courseId ?? offering.course.id ?? "");
    setTermId(offering.termId ?? offering.term.id ?? "");
    setTeacherId(offering.teacher?.id ?? "");
    setSection(offering.section);
    setMessage("");
  }

  function beginEditTerm(row: Term) {
    setEditingTermId(row.id);
    setTerm({
      code: row.code,
      label: row.label,
      academicYear: row.academicYear,
      startsAt: row.startsAt.slice(0, 10),
      endsAt: row.endsAt.slice(0, 10),
      active: row.active,
    });
    setMessage("");
  }

  async function saveTerm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const payload = {
        code: term.code.trim(),
        label: term.label.trim(),
        academicYear: term.academicYear.trim(),
        startsAt: term.startsAt,
        endsAt: term.endsAt,
        active: term.active,
      };
      if (editingTermId) {
        await apiPatch(`/terms/${editingTermId}`, payload);
        setMessage("Term updated.");
      } else {
        const result = await apiPost<Term>("/terms", payload);
        setTermId(result.data.id);
        setMessage("Term saved to the database.");
      }
      setEditingTermId(null);
      setTerm({ code: "", label: "", academicYear: "", startsAt: "", endsAt: "", active: false });
      const refreshed = await reloadTerms();
      if (!refreshed.ok) setMessage((current) => `${current} List refresh failed: ${refreshed.error}`);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to save term.");
    } finally {
      setBusy(false);
    }
  }

  async function saveOffering(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const payload = { courseId, termId, ...(teacherId ? { teacherId } : { teacherId: null }), section: section.trim() || "A" };
      if (editingOfferingId) {
        await apiPatch(`/offerings/${editingOfferingId}`, payload);
        setMessage("Course offering updated.");
      } else {
        await apiPost("/offerings", { courseId, termId, ...(teacherId ? { teacherId } : {}), section: section.trim() || "A" });
        setMessage("Course offering saved.");
      }
      resetOfferingForm();
      const refreshed = await reload();
      if (!refreshed.ok) setMessage((current) => `${current} List refresh failed: ${refreshed.error}`);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to save offering.");
    } finally {
      setBusy(false);
    }
  }

  async function enroll() {
    if (!selected || !studentId || busy) return;
    setBusy(true);
    setMessage("");
    try {
      await apiPost(`/offerings/${selected}/enrollments`, { studentId });
      setEnrollments((await apiGet<Enrollment[]>(`/offerings/${selected}/enrollments`)).data);
      setMessage("Enrollment saved.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to enroll student.");
    } finally {
      setBusy(false);
    }
  }

  async function withdraw(student: string) {
    if (!selected || busy) return;
    setBusy(true);
    setMessage("");
    try {
      await apiDelete(`/offerings/${selected}/enrollments/${student}`);
      setEnrollments((await apiGet<Enrollment[]>(`/offerings/${selected}/enrollments`)).data);
      setMessage("Enrollment withdrawn.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to withdraw enrollment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Terms, course offerings, and enrollments</h2>
        <p className="text-sm text-slate-600">Create and edit terms and offerings manually. Enrollment changes are kept in PostgreSQL.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>{editingTermId ? "Edit academic term" : "Create academic term"}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(event) => void saveTerm(event)} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {(["code", "label", "academicYear", "startsAt", "endsAt"] as const).map((key) => (
              <label key={key} className="text-sm">
                {key}
                <input
                  required
                  type={key.endsWith("At") ? "date" : "text"}
                  className="mt-1 h-10 w-full rounded border px-2"
                  value={term[key]}
                  onChange={(event) => setTerm({ ...term, [key]: event.target.value })}
                />
              </label>
            ))}
            <label className="flex items-end gap-2 text-sm">
              <input type="checkbox" checked={term.active} onChange={(event) => setTerm({ ...term, active: event.target.checked })} />
              Active term
            </label>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={busy}>{busy ? "Saving…" : editingTermId ? "Update term" : "Save term"}</Button>
              {editingTermId ? <Button type="button" variant="outline" disabled={busy} onClick={() => { setEditingTermId(null); setTerm({ code: "", label: "", academicYear: "", startsAt: "", endsAt: "", active: false }); }}>Cancel</Button> : null}
            </div>
          </form>
          {terms.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr>{["Code", "Label", "Year", "Active", ""].map((heading) => <th key={heading} className="px-2 py-2">{heading}</th>)}</tr></thead>
                <tbody>
                  {terms.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="px-2 py-2">{row.code}</td>
                      <td>{row.label}</td>
                      <td>{row.academicYear}</td>
                      <td>{row.active ? "Yes" : "No"}</td>
                      <td><Button size="sm" variant="outline" disabled={busy} onClick={() => beginEditTerm(row)}>Edit</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{editingOfferingId ? "Edit offering" : "Create offering"}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(event) => void saveOffering(event)} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm">
              Course
              <select required className="mt-1 h-10 w-full rounded border px-2" value={courseId} onChange={(event) => setCourseId(event.target.value)}>
                <option value="">Select course</option>
                {courses.filter((course) => course.active).map((course) => <option key={course.id} value={course.id}>{course.code} · {course.name}</option>)}
              </select>
            </label>
            <label className="text-sm">
              Term
              <select required className="mt-1 h-10 w-full rounded border px-2" value={termId} onChange={(event) => setTermId(event.target.value)}>
                <option value="">Select term</option>
                {terms.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.label}</option>)}
              </select>
            </label>
            <label className="text-sm">
              Teacher (optional)
              <select className="mt-1 h-10 w-full rounded border px-2" value={teacherId} onChange={(event) => setTeacherId(event.target.value)}>
                <option value="">Unassigned</option>
                {teachers.filter((teacher) => teacher.status !== "INACTIVE").map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
              </select>
            </label>
            <label className="text-sm">
              Section
              <input className="mt-1 h-10 w-full rounded border px-2" value={section} maxLength={32} onChange={(event) => setSection(event.target.value)} />
            </label>
            <div className="flex gap-2">
              <Button type="submit" disabled={busy || !courseId || !termId}>{busy ? "Saving…" : editingOfferingId ? "Update offering" : "Save offering"}</Button>
              {editingOfferingId ? <Button type="button" variant="outline" disabled={busy} onClick={resetOfferingForm}>Cancel</Button> : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {message ? <p role="status" className="text-sm">{message}</p> : null}
      {loading ? <p>Loading offerings…</p> : error ? <p role="alert">{error}</p> : offerings.length === 0 ? (
        <EmptyState title="No offerings" description="Create an offering after adding courses and terms." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr>{["Course", "Term", "Section", "Teacher", "Enrollment", ""].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead>
              <tbody>
                {offerings.map((offering) => (
                  <tr key={offering.id} className="border-t">
                    <td className="px-4 py-3">{offering.course.code} · {offering.course.name}</td>
                    <td>{offering.term.label}</td>
                    <td>{offering.section}</td>
                    <td>{offering.teacher?.name ?? "Unassigned"}</td>
                    <td>{offering._count.enrollments}</td>
                    <td className="space-x-2 px-4 py-3">
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => beginEditOffering(offering)}>Edit</Button>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => setSelected(offering.id)}>Enrollments</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {selected ? (
        <Card>
          <CardHeader><CardTitle>Offering enrollment</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <select className="h-10 min-w-64 rounded border px-2" value={studentId} onChange={(event) => setStudentId(event.target.value)}>
                <option value="">Select active student</option>
                {students.map((student) => <option key={student.id} value={student.id}>{student.studentNumber} · {student.name}</option>)}
              </select>
              <Button onClick={() => void enroll()} disabled={busy || !studentId}>{busy ? "Working…" : "Enroll"}</Button>
              <Button variant="outline" disabled={busy} onClick={() => setSelected("")}>Close</Button>
            </div>
            {enrollments.map((row) => (
              <div key={row.id} className="flex items-center justify-between border-t py-2 text-sm">
                <span>{row.student.studentNumber} · {row.student.name} · {row.status}</span>
                {row.status === "ENROLLED" ? <Button variant="ghost" size="sm" className="text-danger" disabled={busy} onClick={() => void withdraw(row.student.id)}>Withdraw</Button> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
