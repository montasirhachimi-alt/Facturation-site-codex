"use client";

import { EntityEmptyState, EntityErrorState, EntityPageLayout } from "@/ui";
import { Building2 } from "lucide-react";
import { CompanyDetailsHeader } from "../components/company-details-header";
import { CompanyDetailsTabs } from "../components/company-details-tabs";
import { CompanyInspectorPanel } from "../components/company-inspector-panel";
import { CompanyOverview } from "../components/company-overview";
import { CompanyPlaceholderTab } from "../components/company-placeholder-tab";
import { CompanySummaryCards } from "../components/company-summary-cards";
import { useCompanyDetails } from "../hooks/use-company-details";

export function CompanyDetailsPage({ companyId }: { companyId: string }) {
  const state = useCompanyDetails(companyId);

  if (!state.canRead) {
    return (
      <EntityPageLayout>
        <EntityErrorState message="Accès refusé au workspace société." />
      </EntityPageLayout>
    );
  }

  if (!state.company) {
    return (
      <EntityPageLayout>
        <EntityEmptyState icon={Building2} title="Société introuvable" description="Cette société n'existe pas dans le workspace actif." />
      </EntityPageLayout>
    );
  }

  return (
    <EntityPageLayout>
      <CompanyDetailsHeader canWrite={state.canWrite} company={state.company} />
      <CompanySummaryCards />
      <CompanyDetailsTabs activeTab={state.activeTab} onChange={state.setActiveTab} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main>{state.activeTab === "overview" ? <CompanyOverview company={state.company} /> : <CompanyPlaceholderTab label={state.activeTab} />}</main>
        <CompanyInspectorPanel />
      </div>
    </EntityPageLayout>
  );
}
