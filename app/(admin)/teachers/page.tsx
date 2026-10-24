import { TeachersView } from "@/components/teachers/teachers-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Teachers" };

export default function TeachersPage() {
  return <TeachersView />;
}
