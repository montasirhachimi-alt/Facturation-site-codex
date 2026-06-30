import type { HicoPilotPreference, PreferenceInput } from "./preferences.types";

export function getPreferenceId(input: Pick<PreferenceInput, "scope" | "key" | "userId" | "workspaceId" | "moduleId">) {
  return [
    input.scope,
    input.userId ?? "global-user",
    input.workspaceId ?? "global-workspace",
    input.moduleId ?? "global-module",
    input.key
  ].join(":");
}

export function createPreference(input: PreferenceInput): HicoPilotPreference {
  const timestamp = new Date().toISOString();

  return {
    ...input,
    id: input.id ?? getPreferenceId(input),
    createdAt: input.createdAt ?? timestamp,
    updatedAt: input.updatedAt ?? timestamp
  };
}

export function updatePreferenceValue(
  preference: HicoPilotPreference,
  value: HicoPilotPreference["value"]
): HicoPilotPreference {
  return {
    ...preference,
    value,
    updatedAt: new Date().toISOString()
  };
}

export function sortPreferences(preferences: HicoPilotPreference[]) {
  return [...preferences].sort((first, second) => {
    if (first.scope !== second.scope) return first.scope.localeCompare(second.scope);
    if (first.category !== second.category) return first.category.localeCompare(second.category);

    return first.key.localeCompare(second.key);
  });
}
