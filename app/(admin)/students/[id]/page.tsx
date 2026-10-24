import { StudentDetailView } from "@/components/students/student-detail";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Student profile" };

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudentDetailView studentId={id} />;
}
