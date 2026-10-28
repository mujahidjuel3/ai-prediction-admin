"use client";

import { ApiCrudView, type CrudColumn, type CrudField } from "@/components/data/api-crud-view";
import { useApiList } from "@/lib/use-api-list";

interface Teacher { id: string; name: string; }
interface Department { id: string; code: string; name: string; headTeacherId: string | null; _count: { students: number; teachers: number; courses: number }; }

export function DepartmentsView() {
  const { items: teachers } = useApiList<Teacher>("/teachers?page=1&pageSize=100");
  const fields: CrudField<Department>[] = [
    { name: "code", label: "Department code", required: true, minLength: 2, maxLength: 16 },
    { name: "name", label: "Department name", required: true, minLength: 2, maxLength: 120 },
    { name: "headTeacherId", label: "Department head (optional)", type: "select", value: (row) => row.headTeacherId ?? "", options: teachers.map((teacher) => ({ label: teacher.name, value: teacher.id })) },
  ];
  const columns: CrudColumn<Department>[] = [
    { label: "Code", value: (row) => <span className="font-medium text-slate-900">{row.code}</span>, sortValue: (row) => row.code },
    { label: "Department", value: (row) => row.name, sortValue: (row) => row.name },
    { label: "Students", value: (row) => row._count.students, sortValue: (row) => row._count.students },
    { label: "Teachers", value: (row) => row._count.teachers, sortValue: (row) => row._count.teachers },
    { label: "Courses", value: (row) => row._count.courses, sortValue: (row) => row._count.courses },
  ];
  return <ApiCrudView title="Departments" description="Database departments and related record counts. Departments with students, teachers, or courses cannot be deleted." endpoint="/departments" fields={fields} columns={columns} makePayload={(v) => ({ code: v.code.trim(), name: v.name.trim(), ...(v.headTeacherId ? { headTeacherId: v.headTeacherId } : {}) })} />;
}
