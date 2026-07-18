import type { ModuleId } from "@/platform/modules/module.types";

export type SearchResultMetadata = Readonly<Record<string, unknown>>;

export type SearchQuery = Readonly<{
  text: string;
  limit?: number;
  modules?: readonly ModuleId[];
}>;

export type SearchResult = Readonly<{
  id: string;
  entityType: string;
  entityId: string;
  moduleId: ModuleId;
  title: string;
  subtitle?: string;
  description?: string;
  keywords?: readonly string[];
  icon?: string;
  url?: string;
  score: number;
  metadata?: SearchResultMetadata;
}>;

export type SearchProviderContext = Readonly<{
  requestedAt: string;
}>;

export type SearchProviderResult = readonly SearchResult[] | Promise<readonly SearchResult[]>;

export type SearchProvider = Readonly<{
  moduleId: ModuleId;
  label?: string;
  search(query: SearchQuery, context: SearchProviderContext): SearchProviderResult;
}>;

export type SearchProviderRegistration = Readonly<{
  moduleId: ModuleId;
  label?: string;
  registeredAt: string;
}>;

export type SearchProviderFailure = Readonly<{
  moduleId: ModuleId;
  message: string;
}>;

export type SearchRuntimeResult = Readonly<{
  results: readonly SearchResult[];
  failures: readonly SearchProviderFailure[];
}>;

export type SearchRuntimeOptions = Readonly<{
  now?: () => string;
}>;
