import { getModules } from "../../registry";
import type { CoreModuleDefinition } from "../../registry";
import type { ModuleSearchResult } from "../types";

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getSearchableText = (module: CoreModuleDefinition) => [
  module.name,
  module.category,
  module.route,
  ...(module.aliases ?? [])
];

const getMatchScore = (query: string, value: string) => {
  const normalizedValue = normalize(value);

  if (!query) return 1;
  if (normalizedValue === query) return 100;
  if (normalizedValue.startsWith(query)) return 80;
  if (normalizedValue.includes(query)) return 60;

  let queryIndex = 0;
  for (const character of normalizedValue) {
    if (character === query[queryIndex]) {
      queryIndex += 1;
    }

    if (queryIndex === query.length) {
      return 35;
    }
  }

  return 0;
};

const getMatchedOn = (module: CoreModuleDefinition, query: string): ModuleSearchResult["matchedOn"] => {
  if (getMatchScore(query, module.name) > 0) return "name";
  if (getMatchScore(query, module.category) > 0) return "category";
  return "alias";
};

export function searchCoreModules(query: string, limit = 8): ModuleSearchResult[] {
  const normalizedQuery = normalize(query);
  const modules = getModules().filter((module) => module.enabled && module.searchable);

  return modules
    .map((module) => {
      const score = Math.max(...getSearchableText(module).map((value) => getMatchScore(normalizedQuery, value)));

      return {
        id: module.id,
        module,
        title: module.name,
        category: module.category,
        route: module.route,
        icon: module.icon,
        score,
        matchedOn: getMatchedOn(module, normalizedQuery)
      };
    })
    .filter((result) => !normalizedQuery || result.score > 0)
    .sort((first, second) => second.score - first.score || first.title.localeCompare(second.title))
    .slice(0, limit);
}
