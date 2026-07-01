import { CRM_DEFAULT_PAGE, CRM_DEFAULT_PAGE_SIZE, CRM_MAX_PAGE_SIZE } from "./crm-constants";

export type CrmPaginationInput = Readonly<{
  page?: number;
  pageSize?: number;
  cursor?: string;
}>;

export type CrmPaginationState = Readonly<{
  page: number;
  pageSize: number;
  total: number;
  offset: number;
  cursor?: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}>;

export type CrmPaginatedResult<T> = Readonly<{
  items: readonly T[];
  pagination: CrmPaginationState;
}>;

export function normalizeCrmPagination(input: CrmPaginationInput = {}, total = 0): CrmPaginationState {
  const page = Math.max(1, Math.floor(input.page ?? CRM_DEFAULT_PAGE));
  const pageSize = Math.min(CRM_MAX_PAGE_SIZE, Math.max(1, Math.floor(input.pageSize ?? CRM_DEFAULT_PAGE_SIZE)));
  const offset = (page - 1) * pageSize;

  return Object.freeze({
    page,
    pageSize,
    total,
    offset,
    cursor: input.cursor,
    hasNextPage: offset + pageSize < total,
    hasPreviousPage: page > 1
  });
}

export function paginateCrmItems<T>(items: readonly T[], input: CrmPaginationInput = {}): CrmPaginatedResult<T> {
  const pagination = normalizeCrmPagination(input, items.length);
  return Object.freeze({
    items: Object.freeze(items.slice(pagination.offset, pagination.offset + pagination.pageSize)),
    pagination
  });
}

