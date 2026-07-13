import type { ImportColumnDefinition, ImportMapping } from "./importer.types";
import { normalizeImportText } from "./shared-formatters";

export function createDefaultImportMapping<TField extends string>(
  columns: readonly ImportColumnDefinition<TField>[],
  headers: readonly string[]
): ImportMapping<TField> {
  const mapping: ImportMapping<TField> = {};
  const availableHeaders = headers.filter(Boolean);

  for (const column of columns) {
    const match = availableHeaders.find((header) =>
      column.aliases.some((alias) => normalizeImportText(header) === normalizeImportText(alias))
    );
    if (match) mapping[column.field] = match;
  }

  return mapping;
}
