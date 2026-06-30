import { preferencesService } from "@/core/preferences";
import type { HicoPilotPreferenceCategory, HicoPilotPreferenceValue, PreferenceInput } from "@/core/preferences";

export class PreferencesService {
  loadPreferences(userId?: string) {
    return userId ? preferencesService.getByUser(userId) : preferencesService.getAll();
  }

  savePreferences(preferences: PreferenceInput[]) {
    return preferences.map((preference) => preferencesService.set(preference));
  }

  update(id: string, value: HicoPilotPreferenceValue) {
    return preferencesService.update(id, value);
  }

  getByCategory(category: HicoPilotPreferenceCategory) {
    return preferencesService.getByCategory(category);
  }

  reset(id: string) {
    return preferencesService.reset(id);
  }

  resetUser(userId: string) {
    return preferencesService.resetUser(userId);
  }
}
