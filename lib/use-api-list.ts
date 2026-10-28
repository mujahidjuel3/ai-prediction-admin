"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, type ApiEnvelope } from "@/lib/api";

export function useApiList<T>(path: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const reload = useCallback(async (): Promise<{ ok: true } | { ok: false; error: string }> => {
    const current = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const url = new URL(path, "http://academic-sentinel.local");
      const requestedPage = url.searchParams.get("page");
      const page = requestedPage && /^[1-9]\d*$/.test(requestedPage) && Number.isSafeInteger(Number(requestedPage)) ? Number(requestedPage) : 1;
      const requestedSize = url.searchParams.get("pageSize");
      const pageSize = requestedSize && /^[1-9]\d*$/.test(requestedSize) && Number(requestedSize) <= 100 ? Number(requestedSize) : 100;
      url.searchParams.set("page", String(page));
      url.searchParams.set("pageSize", String(pageSize));
      const requestPath = `${url.pathname}${url.search}`;
      const first = await apiGet<T[] | ApiEnvelope<T[]>>(requestPath);
      const rows = Array.isArray(first.data) ? first.data : first.data.data;
      const reportedPages = Array.isArray(first.data) ? 1 : first.meta?.totalPages ?? 1;
      const pages = Number.isSafeInteger(reportedPages) && reportedPages >= 1 ? reportedPages : 1;
      const all = [...rows];
      for (let page = 2; page <= pages; page += 1) {
        url.searchParams.set("page", String(page));
        const next = await apiGet<T[]>(`${url.pathname}${url.search}`);
        all.push(...next.data);
      }
      if (current === generation.current) setItems(all);
      return { ok: true };
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not load records.";
      if (current === generation.current) setError(message);
      return { ok: false, error: message };
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void reload(); }, 0);
    return () => { window.clearTimeout(timer); generation.current += 1; };
  }, [reload]);
  return { items, loading, error, reload };
}
