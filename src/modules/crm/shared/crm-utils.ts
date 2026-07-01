export function normalizeCrmString(value: unknown) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function normalizeCrmTokens(value: unknown) {
  return Object.freeze(normalizeCrmString(value).split(/\s+/).filter(Boolean));
}

export function normalizeCrmTags(tags: readonly string[] = []) {
  return Object.freeze([...new Set(tags.map(normalizeCrmString).filter(Boolean))].sort((first, second) => first.localeCompare(second)));
}

export function createCrmTimestamp(now: () => string = () => new Date().toISOString()) {
  return now();
}

export function createCrmDisplayLabel(...parts: readonly unknown[]) {
  return parts.map((part) => String(part ?? "").trim()).filter(Boolean).join(" - ");
}

export function isCrmSafeId(value: unknown) {
  return typeof value === "string" && /^[a-zA-Z0-9_.:-]+$/.test(value.trim());
}

export function compareCrmValues(first: unknown, second: unknown) {
  const firstValue = first instanceof Date ? first.toISOString() : String(first ?? "");
  const secondValue = second instanceof Date ? second.toISOString() : String(second ?? "");
  return firstValue.localeCompare(secondValue);
}

export function areCrmValuesEqual(first: unknown, second: unknown) {
  return stableStringify(first) === stableStringify(second);
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
    .join(",")}}`;
}

