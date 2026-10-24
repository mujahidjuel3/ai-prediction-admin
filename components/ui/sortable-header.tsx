import { TH } from "@/components/ui/table";
import type { SortDirection } from "@/types/common";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

interface SortableHeaderProps {
  label: string;
  column: string;
  sortKey: string;
  direction: SortDirection;
  onSort: (column: string) => void;
}

export function SortableHeader({
  label,
  column,
  sortKey,
  direction,
  onSort,
}: SortableHeaderProps) {
  const active = column === sortKey;
  return (
    <TH aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        className="inline-flex items-center gap-1 font-medium text-slate-500 hover:text-slate-900"
        onClick={() => onSort(column)}
      >
        {label}
        {active ? (
          direction === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          )
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />
        )}
      </button>
    </TH>
  );
}
