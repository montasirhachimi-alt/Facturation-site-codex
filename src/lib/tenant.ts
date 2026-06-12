import type { TenantScope } from "@/lib/types";

export function assertTenantAccess(scope: TenantScope, companyId: string) {
  if (scope.role === "SUPER_ADMIN") {
    return;
  }

  if (scope.companyId !== companyId) {
    throw new Error("Accès refusé: les données appartiennent à une autre entreprise.");
  }
}

export function tenantWhere(scope: TenantScope) {
  return scope.role === "SUPER_ADMIN" ? {} : { companyId: scope.companyId };
}
