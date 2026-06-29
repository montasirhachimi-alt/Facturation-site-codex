import type { CorePermissionRequirement, CoreRegistryItem } from "../types";

export type SearchEntityType =
  | "client"
  | "invoice"
  | "quote"
  | "product"
  | "payment"
  | "employee"
  | (string & {});

export type SearchScope = "global" | "company" | "module" | (string & {});

export type SearchQuery = {
  term: string;
  companyId?: string;
  scope?: SearchScope;
  limit?: number;
};

export type SearchResult = {
  id: string;
  entityType: SearchEntityType;
  title: string;
  subtitle?: string;
  href?: string;
  score?: number;
  metadata?: Record<string, unknown>;
};

export type SearchProviderDefinition<TQuery extends SearchQuery = SearchQuery> = CoreRegistryItem<{
  entityType: SearchEntityType;
  keywords?: string[];
}> & {
  entityType: SearchEntityType;
  permissions?: CorePermissionRequirement[];
  resolve?: (query: TQuery) => SearchResult[] | Promise<SearchResult[]>;
};
