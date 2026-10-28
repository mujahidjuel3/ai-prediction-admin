"use client";

import { useOverlay } from "@/hooks/use-overlay";
import { APP_NAME } from "@/lib/constants";
import { isActivePath, NAV_GROUPS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { GraduationCap, LogOut, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SessionIdentity } from "@/components/auth/session-identity";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);
  const [viewport, setViewport] = useState<"unknown" | "mobile" | "desktop">("unknown");

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setViewport(media.matches ? "desktop" : "mobile");
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const modal = open && viewport !== "desktop";
  const parked = viewport === "mobile" && !open;
  useOverlay(modal, onClose, ref);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/40 lg:hidden",
          open ? "block" : "hidden",
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={ref}
        id="admin-sidebar"
        role={modal ? "dialog" : "navigation"}
        aria-modal={modal ? true : undefined}
        aria-label="Primary"
        inert={parked ? true : undefined}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col border-r border-slate-200 bg-white transition-transform duration-200 motion-reduce:transition-none lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5" onClick={onClose}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-white">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold text-slate-900">{APP_NAME}</span>
              <span className="block truncate text-[11px] text-slate-500">
                Local administration
              </span>
            </span>
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={onClose}
            aria-label="Close navigation"
            data-initial-focus
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                          active
                            ? "bg-blue-50 text-primary"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <SessionIdentity />
          <Link
            href="/signed-out"
            className="mt-3 flex min-h-10 w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-600 hover:bg-slate-50"
            onClick={onClose}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </Link>
        </div>
      </aside>
    </>
  );
}
