import { CoursesView } from "@/components/courses/courses-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Courses" };

export default function CoursesPage() {
  return <CoursesView />;
}
