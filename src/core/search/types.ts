import type { CorePermissionRequirement, CoreRegistryItem } from "../types";
import type { CoreModuleDefinition } from "../registry";

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

export type ModuleSearchResult = {
  id: string;
  module: CoreModuleDefinition;
  title: string;
  category: string;
  route: string;
  icon: string;
  score: number;
  matchedOn: "name" | "category" | "alias";
};

export type UniversalSearchState = {
  open: boolean;
  query: string;
  selectedIndex: number;
  results: ModuleSearchResult[];
};

export type SearchProviderDefinition<TQuery extends SearchQuery = SearchQuery> = CoreRegistryItem<{
  entityType: SearchEntityType;
  keywords?: string[];
}> & {
  entityType: SearchEntityType;
  permissions?: CorePermissionRequirement[];
  resolve?: (query: TQuery) => SearchResult[] | Promise<SearchResult[]>;
};
