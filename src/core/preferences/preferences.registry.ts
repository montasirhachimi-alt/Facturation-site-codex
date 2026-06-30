import type {
  HicoPilotPreference,
  HicoPilotPreferenceCategory,
  HicoPilotPreferenceScope,
  HicoPilotPreferenceValue,
  PreferenceInput
} from "./preferences.types";
import { createPreference, getPreferenceId, sortPreferences, updatePreferenceValue } from "./preferences.utils";

const preferences = new Map<string, HicoPilotPreference>();
const defaultPreferences = new Map<string, HicoPilotPreference>();

export function setPreference(input: PreferenceInput) {
  const id = input.id ?? getPreferenceId(input);
  const existing = preferences.get(id);
  const preference = existing
    ? updatePreferenceValue({ ...existing, ...input, id }, input.value)
    : createPreference({ ...input, id });

  preferences.set(preference.id, preference);
  return preference;
}

export function registerDefaultPreference(input: PreferenceInput) {
  const preference = createPreference(input);
  defaultPreferences.set(preference.id, preference);
  preferences.set(preference.id, preference);
  return preference;
}

export function getPreference(id: string) {
  return preferences.get(id);
}

export function getPreferences() {
  return sortPreferences([...preferences.values()]);
}

export function getPreferencesByUser(userId: string) {
  return getPreferences().filter((preference) => preference.userId === userId);
}

export function getPreferencesByWorkspace(workspaceId: string) {
  return getPreferences().filter((preference) => preference.workspaceId === workspaceId);
}

export function getPreferencesByCategory(category: HicoPilotPreferenceCategory) {
  return getPreferences().filter((preference) => preference.category === category);
}

export function getPreferencesByScope(scope: HicoPilotPreferenceScope) {
  return getPreferences().filter((preference) => preference.scope === scope);
}

export function removePreference(id: string) {
  const preference = preferences.get(id);
  preferences.delete(id);
  return preference;
}

export function resetPreference(id: string) {
  const defaultPreference = defaultPreferences.get(id);

  if (!defaultPreference) {
    return removePreference(id);
  }

  preferences.set(id, defaultPreference);
  return defaultPreference;
}

export function resetUserPreferences(userId: string) {
  getPreferencesByUser(userId).forEach((preference) => resetPreference(preference.id));
  return getPreferencesByUser(userId);
}

export function resetWorkspacePreferences(workspaceId: string) {
  getPreferencesByWorkspace(workspaceId).forEach((preference) => resetPreference(preference.id));
  return getPreferencesByWorkspace(workspaceId);
}

export function updatePreference(id: string, value: HicoPilotPreferenceValue) {
  const preference = preferences.get(id);
  if (!preference) return undefined;

  const updated = updatePreferenceValue(preference, value);
  preferences.set(id, updated);
  return updated;
}

export function clearPreferences() {
  preferences.clear();
  defaultPreferences.clear();
}
