import { DepartmentsView } from "@/components/departments/departments-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Departments" };

export default function DepartmentsPage() {
  return <DepartmentsView />;
}
