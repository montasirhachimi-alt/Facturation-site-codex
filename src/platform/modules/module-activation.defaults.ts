import type { ModuleActivationRequest } from "./module-activation.types";

export const alphaActivationProfile = Object.freeze({
  profileKey: "alpha.current",
  includeDefaults: false,
  strictDependencies: true,
  allowHidden: true,
  allowPreview: false,
  allowPlanned: false,
  allowDeprecated: false,
  enabledModuleIds: Object.freeze([
    "core.dashboard",
    "core.settings",
    "crm.overview",
    "crm.companies",
    "crm.contacts",
    "crm.meetings",
    "crm.tasks",
    "crm.notes",
    "sales.quotes",
    "sales.invoices",
    "sales.payments"
  ]),
  disabledModuleIds: Object.freeze([])
} satisfies ModuleActivationRequest);
