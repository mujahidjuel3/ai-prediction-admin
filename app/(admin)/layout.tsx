import { AdminShell } from "@/components/layout/admin-shell";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'ADMIN') redirect('/signed-out?reason=forbidden');
  return <AdminShell>{children}</AdminShell>;
}
