import type { EntityPickerItem } from "./entity-picker.types";

export function filterEntityPickerItems(items: readonly EntityPickerItem[], query: string) {
  const normalizedQuery = normalizeEntityPickerText(query);
  const availableItems = items.filter((item) => !item.disabled);

  if (!normalizedQuery) return availableItems.slice(0, 8);

  return availableItems
    .map((item) => ({
      item,
      score: scoreEntityPickerItem(item, normalizedQuery)
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, "fr"))
    .map((result) => result.item)
    .slice(0, 10);
}

export function findEntityPickerItem(items: readonly EntityPickerItem[], value: string) {
  if (!value.trim()) return null;
  return items.find((item) => item.id === value || item.title === value) ?? null;
}

export function normalizeEntityPickerText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9/ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreEntityPickerItem(item: EntityPickerItem, normalizedQuery: string) {
  const values = [item.title, item.typeLabel, item.metadata, item.id, ...(item.keywords ?? [])].map(normalizeEntityPickerText);
  let bestScore = 0;

  for (const value of values) {
    if (!value) continue;
    if (value === normalizedQuery) bestScore = Math.max(bestScore, 140);
    if (value.startsWith(normalizedQuery)) bestScore = Math.max(bestScore, 110);
    if (value.includes(normalizedQuery)) bestScore = Math.max(bestScore, 80);

    if (value.split(" ").some((word) => word.startsWith(normalizedQuery))) {
      bestScore = Math.max(bestScore, 100);
    }
  }

  return bestScore;
}
