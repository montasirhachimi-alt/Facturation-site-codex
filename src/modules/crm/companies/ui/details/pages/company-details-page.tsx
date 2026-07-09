"use client";

import { EntityEmptyState, EntityErrorState, EntityPageLayout } from "@/ui";
import { Building2 } from "lucide-react";
import { CompanyContactsWorkspace } from "@/modules/crm/contacts";
import { CompanyActivityTimeline } from "@/modules/crm/activities/ui/company-activity-timeline";
import { CompanyOpportunitiesPanel } from "@/modules/crm/opportunities/ui/company-opportunities-panel";
import { CompanyQuotesPanel } from "@/modules/sales/quotes/ui";
import { CompanyInvoicesPanel } from "@/modules/sales/invoices/ui";
import { CompanyDetailsHeader } from "../components/company-details-header";
import { CompanyDetailsTabs } from "../components/company-details-tabs";
import { CompanyInspectorPanel } from "../components/company-inspector-panel";
import { CompanyNotesPanel } from "../components/company-notes-panel";
import { CompanyOverview } from "../components/company-overview";
import { CompanyPlaceholderTab } from "../components/company-placeholder-tab";
import { CompanyRelationshipGraph } from "../components/company-relationship-graph";
import { CompanySummaryCards } from "../components/company-summary-cards";
import { CompanyTasksWidget } from "../components/company-tasks-widget";
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-4">
          {state.activeTab === "overview" ? (
            <>
              <CompanyRelationshipGraph />
              <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
                <CompanyActivityTimeline companyId={state.company.id} />
                <div className="space-y-4">
                  <CompanyNotesPanel />
                  <CompanyTasksWidget />
                </div>
              </div>
              <CompanyOverview company={state.company} />
            </>
          ) : state.activeTab === "contacts" ? (
            <CompanyContactsWorkspace companyId={state.company.id} />
          ) : state.activeTab === "opportunities" ? (
            <CompanyOpportunitiesPanel companyId={state.company.id} />
          ) : state.activeTab === "quotes" ? (
            <CompanyQuotesPanel companyId={state.company.id} />
          ) : state.activeTab === "invoices" ? (
            <CompanyInvoicesPanel companyId={state.company.id} />
          ) : (
            <CompanyPlaceholderTab label={state.activeTab} />
          )}
        </main>
        <CompanyInspectorPanel />
      </div>
    </EntityPageLayout>
  );
}
