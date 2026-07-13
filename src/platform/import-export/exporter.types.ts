import type { ImportExportFormat } from "./importer.types";

export type ExportColumnDefinition<TEntity> = Readonly<{
  field: string;
  label: string;
  formatter: (entity: TEntity) => string | number | boolean;
  width?: number;
}>;

export type ExporterDefinition<TEntity> = Readonly<{
  identifier: string;
  entityLabel: string;
  supportedFormats: readonly ImportExportFormat[];
  columns: readonly ExportColumnDefinition<TEntity>[];
  filename: (scope: "all" | "filtered" | "selected", format: ImportExportFormat) => string;
}>;
