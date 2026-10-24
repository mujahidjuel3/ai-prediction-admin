import { MAX_IMPORT_ROWS } from "@/lib/constants";
import type { AcademicRecordInput } from "@/types/academic-record";
import type { AdminState } from "@/types/state";

export interface ImportPreviewRow {
  line: number;
  studentLabel: string;
  courseLabel: string;
  attendance: string;
  assignment: string;
  quiz: string;
  midterm: string;
  finalMark: string;
  semester: string;
  mode: "create" | "update" | "invalid";
  errors: string[];
  record: AcademicRecordInput | null;
}

export interface RecordImportResult {
  error?: string;
  rows: ImportPreviewRow[];
}

const REQUIRED = [
  "student_id",
  "course_code",
  "attendance",
  "assignment",
  "quiz",
  "midterm",
  "final",
  "semester",
] as const;

export const RECORD_IMPORT_TEMPLATE = [
  "student_id,course_code,attendance,assignment,quiz,midterm,final,semester",
  "CSE-2022-014,CSE 310,70,65,68,64,66,6",
].join("\n");

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function parseCsv(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (char === "\n") {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows.filter((entry) => entry.some((value) => value.length > 0));
}

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

function percent(raw: string, label: string, errors: string[]): number | null {
  if (raw.trim() === "") {
    errors.push(`${label} is required.`);
    return null;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    errors.push(`${label} must be a number from 0 to 100.`);
    return null;
  }
  return Math.round(value);
}

export function buildRecordImport(text: string, state: AdminState): RecordImportResult {
  const table = parseCsv(text);
  if (table.length === 0) return { error: "The file is empty.", rows: [] };

  const header = table[0]?.map(normalizeHeader) ?? [];
  const missing = REQUIRED.filter((column) => !header.includes(column));
  if (missing.length > 0) {
    return {
      error: `The CSV must include these columns: ${REQUIRED.join(", ")}.`,
      rows: [],
    };
  }

  const dataRows = table.slice(1);
  if (dataRows.length === 0) return { error: "The file has a header but no data rows.", rows: [] };
  if (dataRows.length > MAX_IMPORT_ROWS) {
    return {
      error: `This demonstration accepts up to ${MAX_IMPORT_ROWS} rows at a time.`,
      rows: [],
    };
  }

  const indexOf = (name: string) => header.indexOf(name);
  const rows: ImportPreviewRow[] = [];
  const seen = new Map<string, number>();

  dataRows.forEach((columns, index) => {
    const errors: string[] = [];
    const studentLabel = columns[indexOf("student_id")] ?? "";
    const courseLabel = columns[indexOf("course_code")] ?? "";
    const attendanceText = columns[indexOf("attendance")] ?? "";
    const assignmentText = columns[indexOf("assignment")] ?? "";
    const quizText = columns[indexOf("quiz")] ?? "";
    const midtermText = columns[indexOf("midterm")] ?? "";
    const finalText = columns[indexOf("final")] ?? "";
    const semesterText = columns[indexOf("semester")] ?? "";

    const student = state.students.find(
      (item) => item.studentId.toLowerCase() === studentLabel.trim().toLowerCase(),
    );
    const course = state.courses.find(
      (item) => item.code.toLowerCase() === courseLabel.trim().toLowerCase(),
    );
    if (!student) errors.push("No student with this ID is in the current session.");
    if (!course) errors.push("No course with this code is in the current session.");

    const attendance = percent(attendanceText, "Attendance", errors);
    const assignment = percent(assignmentText, "Assignment", errors);
    const quiz = percent(quizText, "Quiz", errors);
    const midterm = percent(midtermText, "Midterm", errors);
    const finalMark = percent(finalText, "Final", errors);
    const semester = Number(semesterText);
    if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
      errors.push("Semester must be a whole number from 1 to 8.");
    }

    let record: AcademicRecordInput | null = null;
    let mode: ImportPreviewRow["mode"] = "invalid";
    if (
      student &&
      course &&
      attendance !== null &&
      assignment !== null &&
      quiz !== null &&
      midterm !== null &&
      finalMark !== null &&
      Number.isInteger(semester) &&
      semester >= 1 &&
      semester <= 8 &&
      errors.length === 0
    ) {
      record = {
        studentId: student.id,
        courseId: course.id,
        attendance,
        assignment,
        quiz,
        midterm,
        finalMark,
        semester,
      };
      const exists = state.records.some(
        (item) =>
          item.studentId === student.id &&
          item.courseId === course.id &&
          item.semester === semester,
      );
      mode = exists ? "update" : "create";
      const key = `${student.id}:${course.id}:${semester}`;
      const previousIndex = seen.get(key);
      if (previousIndex !== undefined) {
        const previous = rows[previousIndex];
        if (previous) {
          previous.errors = ["Superseded by a later row in this file."];
          previous.record = null;
          previous.mode = "invalid";
        }
      }
      seen.set(key, rows.length);
    }

    rows.push({
      line: index + 2,
      studentLabel,
      courseLabel,
      attendance: attendanceText,
      assignment: assignmentText,
      quiz: quizText,
      midterm: midtermText,
      finalMark: finalText,
      semester: semesterText,
      mode,
      errors,
      record,
    });
  });

  return { rows };
}
