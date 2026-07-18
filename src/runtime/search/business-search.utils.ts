import type { SearchQuery, SearchResult } from "./business-search.types";

export function normalizeSearchQuery(query: SearchQuery): SearchQuery {
  return Object.freeze({
    ...query,
    text: query.text.trim(),
    modules: query.modules ? Object.freeze([...query.modules]) : undefined
  });
}

export function validateSearchQuery(query: SearchQuery) {
  if (typeof query.text !== "string") {
    throw new Error("Search query text is required.");
  }

  if (typeof query.limit === "number" && query.limit < 0) {
    throw new Error("Search query limit must be greater than or equal to zero.");
  }
}

export function normalizeSearchResults(results: readonly SearchResult[], query: SearchQuery): readonly SearchResult[] {
  const unique = new Map<string, SearchResult>();

  for (const result of results) {
    if (!isSearchResultValid(result)) continue;
    if (query.modules?.length && !query.modules.includes(result.moduleId)) continue;

    unique.set(result.id, freezeSearchResult(result));
  }

  const sorted = [...unique.values()].sort(compareSearchResults);
  const limited = typeof query.limit === "number" ? sorted.slice(0, query.limit) : sorted;

  return Object.freeze(limited);
}

export function compareSearchResults(first: SearchResult, second: SearchResult) {
  const scoreComparison = second.score - first.score;
  if (scoreComparison !== 0) return scoreComparison;

  const moduleComparison = first.moduleId.localeCompare(second.moduleId);
  if (moduleComparison !== 0) return moduleComparison;

  const typeComparison = first.entityType.localeCompare(second.entityType);
  if (typeComparison !== 0) return typeComparison;

  const titleComparison = first.title.localeCompare(second.title, "fr");
  if (titleComparison !== 0) return titleComparison;

  return first.id.localeCompare(second.id);
}

export function freezeSearchResult(result: SearchResult): SearchResult {
  return Object.freeze({
    ...result,
    keywords: result.keywords ? Object.freeze([...result.keywords]) : undefined,
    metadata: result.metadata ? Object.freeze({ ...result.metadata }) : undefined
  });
}

export function providerFailureMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Search provider failed.";
}

function isSearchResultValid(result: SearchResult) {
  return Boolean(
    result.id.trim() &&
      result.entityType.trim() &&
      result.entityId.trim() &&
      result.moduleId.trim() &&
      result.title.trim() &&
      Number.isFinite(result.score)
  );
}
