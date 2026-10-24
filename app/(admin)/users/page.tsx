import { UsersView } from "@/components/users/users-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "User Management" };

export default function UsersPage() {
  return <UsersView />;
}
