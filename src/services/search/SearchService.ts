import { getCommands } from "@/core/commands";
import { getFavorites } from "@/core/favorites";
import { getRecentItems } from "@/core/recent";
import { searchCoreModules } from "@/core/search";
import type { ModuleSearchResult } from "@/core/search";
import { businessSearchRuntime } from "@/runtime/search";
import type { SearchProvider, SearchQuery as RuntimeSearchQuery, SearchResult as RuntimeSearchResult } from "@/runtime/search";
import { ensureDefaultSearchProvidersRegistered } from "./search-provider.bootstrap";

export type GlobalSearchOptions = {
  query: string;
  limit?: number;
};

export class SearchService {
  constructor() {
    ensureDefaultSearchProvidersRegistered();
  }

  search(query: string, limit?: number): ModuleSearchResult[];
  search(query: RuntimeSearchQuery): Promise<readonly RuntimeSearchResult[]>;
  search(query: string | RuntimeSearchQuery, limit?: number) {
    if (typeof query !== "string") {
      return businessSearchRuntime.search(query);
    }

    return this.searchModules(query, limit);
  }

  registerProvider(provider: SearchProvider) {
    return businessSearchRuntime.registerProvider(provider);
  }

  unregisterProvider(moduleId: SearchProvider["moduleId"]) {
    return businessSearchRuntime.unregisterProvider(moduleId);
  }

  listProviders() {
    return businessSearchRuntime.listProviders();
  }

  searchUnified(query: RuntimeSearchQuery) {
    return businessSearchRuntime.search(query);
  }

  searchUnifiedWithDiagnostics(query: RuntimeSearchQuery) {
    return businessSearchRuntime.searchWithDiagnostics(query);
  }

  searchModules(query: string, limit?: number) {
    return searchCoreModules(query, limit);
  }

  getSearchResults(query: string, limit?: number) {
    return this.searchModules(query, limit);
  }

  getSearchResultByRoute(route: string) {
    return this.searchModules("", 100).find((result) => result.route === route);
  }

  searchCommands(query: string) {
    const normalizedQuery = query.trim().toLowerCase();

    return getCommands().filter((command) => {
      return [command.label, command.description, command.category, ...(command.keywords ?? [])]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery));
    });
  }

  searchRecent(query: string) {
    const normalizedQuery = query.trim().toLowerCase();

    return getRecentItems().filter((item) => {
      return [item.title, item.subtitle, item.targetType, item.moduleId]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery));
    });
  }

  searchFavorites(query: string) {
    const normalizedQuery = query.trim().toLowerCase();

    return getFavorites().filter((favorite) => {
      return [favorite.title, favorite.targetType, favorite.moduleId]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery));
    });
  }

  globalSearch({ query, limit = 8 }: GlobalSearchOptions) {
    return {
      modules: this.searchModules(query, limit),
      commands: this.searchCommands(query).slice(0, limit),
      recent: this.searchRecent(query).slice(0, limit),
      favorites: this.searchFavorites(query).slice(0, limit)
    };
  }
}
