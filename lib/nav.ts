import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  Building2,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  Settings,
  ShieldAlert,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/analytics", label: "Analytics", icon: LineChart },
      { href: "/reports", label: "Reports", icon: FileText },
    ],
  },
  {
    label: "Academic directory",
    items: [
      { href: "/students", label: "Students", icon: Users },
      { href: "/teachers", label: "Teachers", icon: GraduationCap },
      { href: "/departments", label: "Departments", icon: Building2 },
      { href: "/courses", label: "Courses", icon: BookOpen },
      { href: "/academic-records", label: "Academic Records", icon: ClipboardList },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { href: "/predictions", label: "AI Predictions", icon: Sparkles },
      { href: "/alerts", label: "Early Warning Alerts", icon: ShieldAlert },
      { href: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/users", label: "User Management", icon: UserCog },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function titleForPath(pathname: string): string {
  if (pathname.startsWith("/students/")) return "Student profile";
  return NAV_ITEMS.find((item) => item.href === pathname)?.label ?? "Administration";
}
