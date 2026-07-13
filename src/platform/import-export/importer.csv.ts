import { escapeCsvCell } from "./shared-formatters";
import type { ImportRawRow } from "./importer.types";

export function parseCsvContent(content: string, options: { separator?: "," | ";" } = {}) {
  const separator = options.separator ?? detectCsvSeparator(content);
  const rows = parseCsvMatrix(content.replace(/^\uFEFF/, ""), separator);
  const headers = (rows[0] ?? []).map((value) => value.trim()).filter(Boolean);
  if (headers.length === 0) throw new Error("La première ligne doit contenir les en-têtes de colonnes.");

  return {
    headers,
    rows: rows.slice(1)
      .filter((row) => row.some((cell) => cell.trim()))
      .map<ImportRawRow>((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])))
  };
}

export function createCsvContent(rows: readonly Record<string, unknown>[], options: { bom?: boolean; separator?: string } = {}) {
  const separator = options.separator ?? ";";
  const headers = Object.keys(rows[0] ?? {});
  const csv = [
    headers.join(separator),
    ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(separator))
  ].join("\n");
  return `${options.bom === false ? "" : "\uFEFF"}${csv}`;
}

export function downloadCsvFile(fileName: string, rows: readonly Record<string, unknown>[]) {
  const blob = new Blob([createCsvContent(rows)], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

function detectCsvSeparator(content: string): "," | ";" {
  const firstLine = content.split(/\r?\n/, 1)[0] ?? "";
  return firstLine.split(";").length >= firstLine.split(",").length ? ";" : ",";
}

function parseCsvMatrix(content: string, separator: "," | ";") {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === separator && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  rows.push(row);
  return rows;
}
