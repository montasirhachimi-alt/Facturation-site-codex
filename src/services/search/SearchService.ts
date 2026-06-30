import { getCommands } from "@/core/commands";
import { getFavorites } from "@/core/favorites";
import { getRecentItems } from "@/core/recent";
import { searchCoreModules } from "@/core/search";

export type GlobalSearchOptions = {
  query: string;
  limit?: number;
};

export class SearchService {
  search(query: string, limit?: number) {
    return this.searchModules(query, limit);
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
