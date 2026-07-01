import { CRM_EMPTY_SEARCH_SCORE } from "./crm-constants";
import { normalizeCrmString, normalizeCrmTokens } from "./crm-utils";
import type { CrmSearchableEntity } from "./crm-types";

export type CrmSearchField<T extends CrmSearchableEntity = CrmSearchableEntity> = keyof T & string;

export type CrmSearchOptions<T extends CrmSearchableEntity = CrmSearchableEntity> = Readonly<{
  query: string;
  fields: readonly CrmSearchField<T>[];
}>;

export type CrmSearchMatch<T extends CrmSearchableEntity = CrmSearchableEntity> = Readonly<{
  entity: T;
  score: number;
  matchedFields: readonly string[];
}>;

export function createCrmSearchIndex<T extends CrmSearchableEntity>(entity: T, fields: readonly CrmSearchField<T>[]) {
  return fields.map((field) => normalizeCrmString(entity[field])).join(" ");
}

export function getCrmSearchScore(value: unknown, tokens: readonly string[]) {
  const normalizedValue = normalizeCrmString(value);
  if (!tokens.length || !normalizedValue) return CRM_EMPTY_SEARCH_SCORE;

  return tokens.reduce((score, token) => {
    if (normalizedValue === token) return score + 10;
    if (normalizedValue.startsWith(token)) return score + 5;
    if (normalizedValue.includes(token)) return score + 2;
    return score;
  }, 0);
}

export function searchCrmEntities<T extends CrmSearchableEntity>(entities: readonly T[], options: CrmSearchOptions<T>) {
  const tokens = normalizeCrmTokens(options.query);
  if (!tokens.length) {
    return Object.freeze(entities.map((entity) => Object.freeze({ entity, score: CRM_EMPTY_SEARCH_SCORE, matchedFields: Object.freeze([]) })));
  }

  return Object.freeze(
    entities
      .map((entity) => {
        const matchedFields: string[] = [];
        const score = options.fields.reduce((currentScore, field) => {
          const fieldScore = getCrmSearchScore(entity[field], tokens);
          if (fieldScore > 0) matchedFields.push(field);
          return currentScore + fieldScore;
        }, 0);

        return Object.freeze({ entity, score, matchedFields: Object.freeze(matchedFields) });
      })
      .filter((match) => match.score > 0)
      .sort((first, second) => second.score - first.score || first.entity.id.localeCompare(second.entity.id))
  );
}

export function matchesCrmSearch<T extends CrmSearchableEntity>(entity: T, options: CrmSearchOptions<T>) {
  return searchCrmEntities([entity], options).length > 0;
}

