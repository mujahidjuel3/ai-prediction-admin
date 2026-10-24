"use client";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState(pathname);

  if (path !== pathname) {
    setPath(pathname);
    if (open) setOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to content
      </a>
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="min-w-0 lg:pl-64">
        <Header open={open} onMenuClick={() => setOpen(true)} />
        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 px-4 py-5 outline-none xs:px-5 md:px-6 lg:px-8 lg:py-6"
        >
          <div className="mx-auto min-w-0 max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
