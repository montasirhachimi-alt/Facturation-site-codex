import type { ModuleId } from "@/platform/modules/module.types";
import type { SearchQuery, SearchResult } from "./business-search.types";

const DEFAULT_MAX_SEARCH_LIMIT = 50;

export function normalizeSearchQuery(query: SearchQuery): SearchQuery {
  const limit = normalizeSearchLimit(query.limit);

  return Object.freeze({
    ...query,
    text: query.text.trim(),
    limit,
    modules: query.modules ? Object.freeze([...query.modules]) : undefined
  });
}

export function validateSearchQuery(query: SearchQuery) {
  if (typeof query.text !== "string") {
    throw new Error("Search query text is required.");
  }
}

export function normalizeSearchResults(results: readonly SearchResult[], query: SearchQuery): readonly SearchResult[] {
  const unique = new Map<string, SearchResult>();

  for (const result of results) {
    if (!isSearchResultValid(result)) continue;
    if (query.modules?.length && !doesModuleMatchSearchFilter(result.moduleId, query.modules)) continue;

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

export type SearchFieldWeight = "identifier" | "title" | "secondary" | "metadata";

export type SearchScoringField = Readonly<{
  value?: string;
  weight: SearchFieldWeight;
}>;

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function scoreSearchFields(queryText: string, fields: readonly SearchScoringField[]) {
  const query = normalizeSearchText(queryText);
  if (!query) return 0;

  let bestScore = 0;

  for (const field of fields) {
    const value = normalizeSearchText(field.value ?? "");
    if (!value) continue;

    bestScore = Math.max(bestScore, scoreSearchField(query, value, field.weight));
  }

  return bestScore;
}

export function doesModuleMatchSearchFilter(moduleId: ModuleId, filters: readonly ModuleId[]) {
  return filters.some((filter) => {
    const normalizedFilter = filter.trim();
    if (!normalizedFilter) return false;
    return moduleId === normalizedFilter || moduleId.startsWith(`${normalizedFilter}.`);
  });
}

function normalizeSearchLimit(limit: number | undefined) {
  if (typeof limit !== "number" || Number.isNaN(limit)) return undefined;
  if (limit <= 0) return 0;
  return Math.min(Math.floor(limit), DEFAULT_MAX_SEARCH_LIMIT);
}

function scoreSearchField(query: string, value: string, weight: SearchFieldWeight) {
  const base = getFieldBaseScore(weight);

  if (value === query) return base + 50;
  if (value.startsWith(query)) return base + 30;
  if (value.includes(query)) return base + 10;

  return 0;
}

function getFieldBaseScore(weight: SearchFieldWeight) {
  if (weight === "identifier") return 100;
  if (weight === "title") return 80;
  if (weight === "secondary") return 50;
  return 30;
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
