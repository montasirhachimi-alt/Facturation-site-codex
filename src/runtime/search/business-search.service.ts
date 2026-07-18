import { SearchRegistry } from "./business-search.registry";
import type {
  SearchProvider,
  SearchProviderFailure,
  SearchProviderRegistration,
  SearchQuery,
  SearchResult,
  SearchRuntimeOptions,
  SearchRuntimeResult
} from "./business-search.types";
import { doesModuleMatchSearchFilter, normalizeSearchQuery, normalizeSearchResults, providerFailureMessage, validateSearchQuery } from "./business-search.utils";

export class BusinessSearchRuntime {
  private readonly registry: SearchRegistry;
  private readonly now: () => string;

  constructor(options: SearchRuntimeOptions = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.registry = new SearchRegistry(this.now);
  }

  registerProvider(provider: SearchProvider): SearchProviderRegistration {
    return this.registry.register(provider);
  }

  unregisterProvider(moduleId: SearchProvider["moduleId"]) {
    return this.registry.unregister(moduleId);
  }

  listProviders() {
    return this.registry.listRegistrations();
  }

  async search(queryInput: SearchQuery): Promise<readonly SearchResult[]> {
    const result = await this.searchWithDiagnostics(queryInput);
    return result.results;
  }

  async searchWithDiagnostics(queryInput: SearchQuery): Promise<SearchRuntimeResult> {
    validateSearchQuery(queryInput);

    const query = normalizeSearchQuery(queryInput);
    if (!query.text) {
      return Object.freeze({
        results: Object.freeze([]),
        failures: Object.freeze([])
      });
    }

    const context = Object.freeze({ requestedAt: this.now() });
    const results: SearchResult[] = [];
    const failures: SearchProviderFailure[] = [];

    for (const provider of this.registry.list()) {
      if (query.modules?.length && !doesModuleMatchSearchFilter(provider.moduleId, query.modules)) continue;

      try {
        const providerResults = await provider.search(query, context);
        results.push(...providerResults);
      } catch (error) {
        failures.push(
          Object.freeze({
            moduleId: provider.moduleId,
            message: providerFailureMessage(error)
          })
        );
      }
    }

    return Object.freeze({
      results: normalizeSearchResults(results, query),
      failures: Object.freeze(failures)
    });
  }

  clearProviders() {
    this.registry.clear();
  }
}

export const businessSearchRuntime = new BusinessSearchRuntime();
