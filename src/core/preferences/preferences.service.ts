import {
  getPreference,
  getPreferences,
  getPreferencesByCategory,
  getPreferencesByScope,
  getPreferencesByUser,
  getPreferencesByWorkspace,
  removePreference,
  resetPreference,
  resetUserPreferences,
  resetWorkspacePreferences,
  setPreference,
  updatePreference
} from "./preferences.registry";
import type {
  HicoPilotPreferenceCategory,
  HicoPilotPreferenceScope,
  HicoPilotPreferenceValue,
  PreferenceInput
} from "./preferences.types";

export const preferencesService = {
  set(input: PreferenceInput) {
    return setPreference(input);
  },

  update(id: string, value: HicoPilotPreferenceValue) {
    return updatePreference(id, value);
  },

  getById(id: string) {
    return getPreference(id);
  },

  getAll() {
    return getPreferences();
  },

  getByUser(userId: string) {
    return getPreferencesByUser(userId);
  },

  getByWorkspace(workspaceId: string) {
    return getPreferencesByWorkspace(workspaceId);
  },

  getByCategory(category: HicoPilotPreferenceCategory) {
    return getPreferencesByCategory(category);
  },

  getByScope(scope: HicoPilotPreferenceScope) {
    return getPreferencesByScope(scope);
  },

  remove(id: string) {
    return removePreference(id);
  },

  reset(id: string) {
    return resetPreference(id);
  },

  resetUser(userId: string) {
    return resetUserPreferences(userId);
  },

  resetWorkspace(workspaceId: string) {
    return resetWorkspacePreferences(workspaceId);
  }
};
