import type { CrmDateRange, CrmSearchableEntity } from "./crm-types";
import { normalizeCrmTags } from "./crm-utils";

export type CrmGenericFilters = Readonly<{
  workspaceId?: string;
  status?: string;
  tags?: readonly string[];
  ownerId?: string;
  createdAt?: CrmDateRange;
  updatedAt?: CrmDateRange;
  archived?: boolean;
}>;

export function filterCrmEntities<T extends CrmSearchableEntity>(entities: readonly T[], filters: CrmGenericFilters) {
  const tags = normalizeCrmTags(filters.tags);

  return Object.freeze(
    entities.filter((entity) => {
      if (filters.workspaceId && entity.workspaceId !== filters.workspaceId) return false;
      if (filters.status && entity.status !== filters.status) return false;
      if (filters.ownerId && entity.ownerId !== filters.ownerId) return false;
      if (filters.archived !== undefined && Boolean(entity.archived) !== filters.archived) return false;
      if (tags.length && !tags.every((tag) => Array.isArray(entity.tags) && entity.tags.includes(tag))) return false;
      if (!matchesDateRange(entity.createdAt, filters.createdAt)) return false;
      if (!matchesDateRange(entity.updatedAt, filters.updatedAt)) return false;
      return true;
    })
  );
}

export function matchesDateRange(value: unknown, range: CrmDateRange | undefined) {
  if (!range?.from && !range?.to) return true;
  if (typeof value !== "string" || !value) return false;

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return false;
  if (range.from && timestamp < Date.parse(range.from)) return false;
  if (range.to && timestamp > Date.parse(range.to)) return false;
  return true;
}

