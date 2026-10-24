import { StudentsView } from "@/components/students/students-view";
import { readParam } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Students" };

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = readParam(params.q, "");
  const department = readParam(params.department);
  const semester = readParam(params.semester);
  const risk = readParam(params.risk);
  return (
    <StudentsView
      key={`${query}|${department}|${semester}|${risk}`}
      initialQuery={query}
      initialDepartment={department}
      initialSemester={semester}
      initialRisk={risk}
    />
  );
}
