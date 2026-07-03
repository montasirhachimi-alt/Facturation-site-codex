import { crmModule } from "./crm/crm.module";
import { salesModule } from "./sales/sales.module";

export const businessModules = Object.freeze([crmModule, salesModule]);

export type BusinessModuleDefinition = (typeof businessModules)[number];

export function getBusinessModules(): readonly BusinessModuleDefinition[] {
  return businessModules;
}

export function getBusinessModule(moduleId: string): BusinessModuleDefinition | undefined {
  return businessModules.find((moduleDefinition) => moduleDefinition.id === moduleId);
}
