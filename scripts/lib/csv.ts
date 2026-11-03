/**
 * Minimal RFC 4180 CSV: comma separator, double-quoted fields with "" escapes, CRLF or LF rows.
 * Enough for the deck master table, which is edited in Google Sheets or Excel.
 */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, ""); // Excel adds a BOM to UTF-8 exports
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"' && field === "") {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (quoted) throw new Error("CSV ends inside a quoted field");
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

/** Rows as objects keyed by the header row. */
export function parseCsvRecords(text: string): Record<string, string>[] {
  const [header, ...rows] = parseCsv(text);
  if (!header) return [];
  return rows.map((r, n) => {
    if (r.length !== header.length) {
      throw new Error(`CSV row ${n + 2} has ${r.length} fields, header has ${header.length}`);
    }
    return Object.fromEntries(header.map((h, i) => [h.trim(), r[i]]));
  });
}

const needsQuotes = /[",\r\n]/;

/** Writes rows back as CSV, quoting only where needed, with a trailing newline. */
export function toCsv(rows: readonly (readonly string[])[]): string {
  return rows
    .map((r) => r.map((f) => (needsQuotes.test(f) ? `"${f.replace(/"/g, '""')}"` : f)).join(","))
    .join("\n")
    .concat("\n");
}
