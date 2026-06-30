import type { CoreModuleId } from "../registry";
import type {
  PREFERENCE_CATEGORIES,
  PREFERENCE_SCOPES,
  PREFERENCE_TYPES
} from "./preferences.constants";

export type HicoPilotPreferenceType = (typeof PREFERENCE_TYPES)[number];

export type HicoPilotPreferenceCategory = (typeof PREFERENCE_CATEGORIES)[number];

export type HicoPilotPreferenceScope = (typeof PREFERENCE_SCOPES)[number];

export type HicoPilotPreferenceValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]
  | Record<string, unknown>;

export type PreferenceMetadata = Record<string, string | number | boolean | null | undefined>;

export type HicoPilotPreference = {
  id: string;
  userId?: string;
  workspaceId?: string;
  key: string;
  value: HicoPilotPreferenceValue;
  type: HicoPilotPreferenceType;
  category: HicoPilotPreferenceCategory;
  scope: HicoPilotPreferenceScope;
  moduleId?: CoreModuleId;
  createdAt: string;
  updatedAt: string;
  metadata?: PreferenceMetadata;
};

export type PreferenceInput = Omit<HicoPilotPreference, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};
