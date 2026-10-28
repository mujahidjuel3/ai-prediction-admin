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
  return (
    <StudentsView key={query} initialQuery={query} />
  );
}
