import { RecordsView } from "@/components/records/records-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Academic Records" };

export default function AcademicRecordsPage() {
  return <RecordsView />;
}
