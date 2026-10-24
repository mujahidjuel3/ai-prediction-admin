"use client";

import { Avatar } from "@/components/ui/avatar";
import { titleForPath } from "@/lib/nav";
import { unreadCount } from "@/lib/selectors";
import { useAdminState } from "@/lib/store";
import { Bell, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface HeaderProps {
  open: boolean;
  onMenuClick: () => void;
}

export function Header({ open, onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const state = useAdminState();
  const unread = unreadCount(state);
  const [menuOpen, setMenuOpen] = useState(false);
  const [path, setPath] = useState(pathname);
  const menuRef = useRef<HTMLDivElement>(null);

  if (path !== pathname) {
    setPath(pathname);
    if (menuOpen) setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    function onPointer(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const studentId = pathname.startsWith("/students/") ? pathname.split("/")[2] : undefined;
  const student = studentId
    ? state.students.find((item) => item.id === studentId)
    : undefined;
  const current = student?.name ?? titleForPath(pathname);
  const section = pathname.startsWith("/students/") ? "Students" : current;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation"
          aria-controls="admin-sidebar"
          aria-expanded={open}
        >
          <Menu className="h-5 w-5" />
        </button>
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex min-w-0 items-center gap-1.5 text-sm">
            <li className="hidden shrink-0 text-slate-500 sm:block">
              {pathname === "/dashboard" ? (
                <span>Administration</span>
              ) : (
                <Link href="/dashboard" className="hover:text-slate-900">
                  Administration
                </Link>
              )}
            </li>
            <li className="hidden text-slate-300 sm:block" aria-hidden="true">
              /
            </li>
            {student ? (
              <>
                <li className="hidden shrink-0 sm:block">
                  <Link href="/students" className="text-slate-500 hover:text-slate-900">
                    Students
                  </Link>
                </li>
                <li className="hidden text-slate-300 sm:block" aria-hidden="true">
                  /
                </li>
              </>
            ) : null}
            <li className="truncate font-semibold text-slate-900" aria-current="page">
              {student ? current : section}
            </li>
          </ol>
          <p className="truncate text-xs text-slate-500">
            {state.settings.system.academicYear} · {state.settings.system.currentSemester}
          </p>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <Link
          href="/notifications"
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
          aria-label={
            unread > 0
              ? `Notifications, ${unread} unread`
              : "Notifications, no unread items"
          }
        >
          <Bell className="h-5 w-5" />
          {unread > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Link>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-md px-1.5 text-left hover:bg-slate-100"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <Avatar name={state.settings.profile.name} size="sm" />
            <span className="hidden leading-tight md:block">
              <span className="block text-sm font-medium text-slate-900">
                {state.settings.profile.name}
              </span>
              <span className="block text-xs text-slate-500">{state.settings.profile.title}</span>
            </span>
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 z-40 mt-1 w-52 rounded-lg border border-slate-200 bg-white p-1 shadow-sm"
            >
              <Link
                role="menuitem"
                href="/settings"
                className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setMenuOpen(false)}
              >
                Settings
              </Link>
              <Link
                role="menuitem"
                href="/signed-out"
                className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setMenuOpen(false)}
              >
                Log out
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
