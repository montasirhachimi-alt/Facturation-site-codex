import type { ExporterDefinition } from "./exporter.types";

export function buildExportRows<TEntity>(definition: ExporterDefinition<TEntity>, entities: readonly TEntity[]) {
  return entities.map((entity) => {
    const row: Record<string, string | number | boolean> = {};
    definition.columns.forEach((column) => {
      row[column.label] = column.formatter(entity);
    });
    return row;
  });
}
