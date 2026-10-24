"use client";

import { pageCount as getPageCount } from "@/lib/utils";
import { useMemo, useState } from "react";

interface UsePaginationResult<T> {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  pagedItems: T[];
  setPage: (page: number) => void;
}

export function usePagination<T>(items: T[], pageSize: number): UsePaginationResult<T> {
  const [page, setPage] = useState(1);
  const count = getPageCount(items.length, pageSize);
  const currentPage = Math.min(page, count);

  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  return {
    page: currentPage,
    pageCount: count,
    pageSize,
    total: items.length,
    pagedItems,
    setPage,
  };
}
