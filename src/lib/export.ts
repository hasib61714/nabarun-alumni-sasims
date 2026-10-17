export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | boolean | null | undefined;
}

const needsQuotes = /[",\r\n]/;

export function csvCell(value: string | number | boolean | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  // Neutralise spreadsheet formulas coming from user-supplied text.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return needsQuotes.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCSV<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [columns.map((c) => csvCell(c.header)).join(",")];
  for (const row of rows) lines.push(columns.map((c) => csvCell(c.value(row))).join(","));
  // BOM so Excel opens Bangla text correctly
  return "﻿" + lines.join("\r\n");
}

export function downloadFile(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const downloadCSV = <T,>(filename: string, rows: T[], columns: CsvColumn<T>[]) =>
  downloadFile(filename, toCSV(rows, columns), "text/csv;charset=utf-8");

export const downloadJSON = (filename: string, data: unknown) =>
  downloadFile(filename, JSON.stringify(data, null, 2), "application/json;charset=utf-8");

export const todayStamp = () => new Date().toISOString().slice(0, 10);
