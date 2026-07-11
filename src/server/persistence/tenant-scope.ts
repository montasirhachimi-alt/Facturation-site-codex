import "server-only";

import { activeCompanyProfile } from "@/lib/demo-data";
import { getCurrentUser } from "@/lib/auth";
import type { AuthSession } from "@/lib/types";
import { prisma } from "./prisma";

export type PersistenceTenantScope = Readonly<{
  companyId: string;
  userId: string;
  role: AuthSession["role"];
}>;

export async function requirePersistenceTenantScope(): Promise<PersistenceTenantScope> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Session requise pour accéder aux données persistées.");
  }

  if (!user.companyId) {
    throw new Error("Aucune entreprise active n'est associée à cette session.");
  }

  await ensureTenantCompany(user.companyId);

  return {
    companyId: user.companyId,
    userId: user.userId,
    role: user.role
  };
}

async function ensureTenantCompany(companyId: string) {
  await prisma.company.upsert({
    where: { id: companyId },
    update: {},
    create: {
      id: companyId,
      name: activeCompanyProfile.name ?? "Entreprise",
      ice: activeCompanyProfile.ice,
      taxId: activeCompanyProfile.taxId,
      phone: activeCompanyProfile.phone,
      email: activeCompanyProfile.email,
      address: activeCompanyProfile.address,
      city: activeCompanyProfile.city,
      logoUrl: activeCompanyProfile.logoUrl
    }
  });
}
