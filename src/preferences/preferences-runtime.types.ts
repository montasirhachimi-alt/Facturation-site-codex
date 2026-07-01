import type {
  HicoPilotPreference,
  HicoPilotPreferenceCategory,
  HicoPilotPreferenceValue
} from "@/core/preferences";
import type { HicoPilotWorkspace, WorkspaceSnapshot } from "@/services/workspace";

export type PreferenceRuntimeFormat = {
  theme: HicoPilotPreferenceValue | undefined;
  density: HicoPilotPreferenceValue | undefined;
  language: HicoPilotPreferenceValue | undefined;
  dateFormat: HicoPilotPreferenceValue | undefined;
  numberFormat: HicoPilotPreferenceValue | undefined;
  timeZone: HicoPilotPreferenceValue | undefined;
};

export type FeatureFlagState = Record<string, boolean>;

export type PreferenceRuntimeValue = {
  currentWorkspace: HicoPilotWorkspace | null;
  workspaceSnapshot: WorkspaceSnapshot | null;
  preferences: HicoPilotPreference[];
  workspacePreferences: HicoPilotPreference[];
  userPreferences: HicoPilotPreference[];
  widgetPreferences: HicoPilotPreference[];
  featureFlags: FeatureFlagState;
  format: PreferenceRuntimeFormat;
  isLoading: boolean;
  error: string | null;
  getPreference: (key: string) => HicoPilotPreference | undefined;
  getPreferenceValue: (key: string) => HicoPilotPreferenceValue | undefined;
  getPreferencesByCategory: (category: HicoPilotPreferenceCategory) => HicoPilotPreference[];
  hasFeatureFlag: (flag: string) => boolean;
  refreshPreferences: () => void;
};
