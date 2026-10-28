function escapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

export function downloadCsv(filename: string, rows: string[][]): boolean {
  if (typeof document === "undefined" || rows.length === 0) return false;
  try {
    const csv = rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

export function countCsvDataRows(csv: string): number {
  let rows = 0;
  let inQuotes = false;
  let hasContent = false;
  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (character === '"') {
      if (inQuotes && csv[index + 1] === '"') index += 1;
      else inQuotes = !inQuotes;
      hasContent = true;
    } else if (!inQuotes && (character === "\n" || character === "\r")) {
      if (hasContent) rows += 1;
      hasContent = false;
      if (character === "\r" && csv[index + 1] === "\n") index += 1;
    } else if (character.trim() !== "") hasContent = true;
  }
  if (hasContent) rows += 1;
  return Math.max(0, rows - 1);
}

export function downloadBlob(filename: string, blob: Blob): boolean {
  if (typeof document === "undefined") return false;
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
