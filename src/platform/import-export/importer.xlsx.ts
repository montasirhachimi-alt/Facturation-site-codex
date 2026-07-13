import type { ImportRawRow } from "./importer.types";
import { parseCsvContent } from "./importer.csv";

export type ParsedWorkbook = Readonly<{
  headers: readonly string[];
  rows: readonly ImportRawRow[];
}>;

export async function parseSpreadsheetFile(
  file: File,
  options: { maxRows: number; maxFileSize: number; emptyMessage?: string; maxSizeMessage?: string }
): Promise<ParsedWorkbook> {
  validateSpreadsheetFile(file, options.maxFileSize, options.maxSizeMessage);
  if (file.name.toLowerCase().endsWith(".csv")) {
    const parsed = parseCsvContent(await file.text());
    if (parsed.rows.length === 0) throw new Error(options.emptyMessage ?? "Le fichier ne contient aucune ligne.");
    if (parsed.rows.length > options.maxRows) throw new Error(`Le fichier dépasse ${options.maxRows} lignes.`);
    return parsed;
  }

  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", raw: false });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!worksheet) throw new Error("Le fichier ne contient aucune feuille lisible.");

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: "", blankrows: false });
  const headers = (matrix[0] ?? []).map((value) => String(value ?? "").trim()).filter(Boolean);
  if (headers.length === 0) throw new Error("La première ligne doit contenir les en-têtes de colonnes.");

  const rows = matrix.slice(1).map((line) => Object.fromEntries(headers.map((header, index) => [header, line[index] ?? ""])));
  if (rows.length === 0) throw new Error(options.emptyMessage ?? "Le fichier ne contient aucune ligne.");
  if (rows.length > options.maxRows) throw new Error(`Le fichier dépasse ${options.maxRows} lignes.`);

  return { headers, rows };
}

export async function downloadXlsxFile(fileName: string, sheets: readonly { name: string; rows: readonly Record<string, unknown>[] | readonly (readonly unknown[])[]; header?: readonly string[]; aoa?: boolean }[]) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  sheets.forEach((sheet) => {
    const worksheet = sheet.aoa
      ? XLSX.utils.aoa_to_sheet((sheet.rows as readonly (readonly unknown[])[]).map((row) => [...row]))
      : XLSX.utils.json_to_sheet([...(sheet.rows as readonly Record<string, unknown>[])], sheet.header ? { header: [...sheet.header] } : undefined);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });
  XLSX.writeFile(workbook, fileName);
}

function validateSpreadsheetFile(file: File, maxFileSize: number, maxSizeMessage?: string) {
  const lowerName = file.name.toLowerCase();
  if (!lowerName.endsWith(".xlsx") && !lowerName.endsWith(".csv")) {
    throw new Error("Format non supporté. Utilisez un fichier .xlsx ou .csv.");
  }
  if (lowerName.endsWith(".xlsm")) {
    throw new Error("Les fichiers Excel avec macros ne sont pas supportés.");
  }
  if (file.size > maxFileSize) {
    throw new Error(maxSizeMessage ?? "Le fichier dépasse la limite autorisée.");
  }
}
