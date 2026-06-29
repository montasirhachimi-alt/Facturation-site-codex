export type PreferenceScope = "user" | "company" | "device" | (string & {});

export type PreferenceValue = string | number | boolean | null | string[] | Record<string, unknown>;

export type PreferenceItem = {
  key: string;
  scope: PreferenceScope;
  value: PreferenceValue;
  userId?: string;
  companyId?: string;
  updatedAt?: string;
};

export type PreferenceDefinition = {
  key: string;
  label: string;
  scope: PreferenceScope;
  defaultValue?: PreferenceValue;
  description?: string;
};
