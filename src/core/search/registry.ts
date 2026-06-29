import type { SearchProviderDefinition } from "./types";

const searchProviders: SearchProviderDefinition[] = [];

export function registerSearchProvider(provider: SearchProviderDefinition) {
  searchProviders.push(provider);
}

export function getSearchProviders() {
  return [...searchProviders];
}

export function clearSearchProviders() {
  searchProviders.length = 0;
}
