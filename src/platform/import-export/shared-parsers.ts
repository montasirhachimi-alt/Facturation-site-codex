export function textValue(row: Record<string, unknown>, header: string | undefined) {
  if (!header) return "";
  const value = row[header];
  return value === null || value === undefined ? "" : String(value).trim();
}

export function optionalTextValue(row: Record<string, unknown>, header: string | undefined) {
  const value = textValue(row, header);
  return value || undefined;
}

export function parseNumberValue(row: Record<string, unknown>, header: string | undefined, fallback: number) {
  const value = textValue(row, header);
  if (!value) return fallback;
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  return Number(normalized);
}

export function parseBooleanValue(value: string, defaultValue = true) {
  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  if (!normalized) return defaultValue;
  if (["non", "no", "false", "0", "archive", "archived", "inactif"].includes(normalized)) return false;
  return true;
}
