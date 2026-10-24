import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
  tone?: "default" | "danger" | "warning" | "success";
}

const toneClasses = {
  default: "bg-blue-50 text-primary",
  danger: "bg-red-50 text-danger",
  warning: "bg-amber-50 text-warning",
  success: "bg-emerald-50 text-success",
};

export function StatCard({ label, value, icon: Icon, href, tone = "default" }: StatCardProps) {
  const className = cn(
    "block rounded-lg border border-slate-200 bg-white p-4",
    href && "hover:border-slate-300",
  );
  const content = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      </div>
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
          toneClasses[tone],
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}
