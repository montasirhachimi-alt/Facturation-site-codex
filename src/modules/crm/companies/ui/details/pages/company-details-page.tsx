"use client";

import { EntityEmptyState, EntityErrorState, EntityPageLayout } from "@/ui";
import { Building2, ContactRound, Receipt, TrendingUp, UsersRound } from "lucide-react";
import { CompanyContactsWorkspace } from "@/modules/crm/contacts";
import { CompanyActivityTimeline } from "@/modules/crm/activities/ui/company-activity-timeline";
import { CompanyOpportunitiesPanel } from "@/modules/crm/opportunities/ui/company-opportunities-panel";
import { CompanyQuotesPanel } from "@/modules/sales/quotes/ui";
import { CompanyInvoicesPanel } from "@/modules/sales/invoices/ui";
import { ContextualActionStrip, useContextualActions } from "@/platform/contextual-actions";
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
  const contextualActions = useContextualActions([
    {
      id: "company.show-contacts",
      entityType: "company",
      label: "Contacts",
      description: "Afficher les interlocuteurs de cette société.",
      icon: ContactRound,
      priority: 10,
      tone: "primary",
      onSelect: () => state.setActiveTab("contacts"),
      available: Boolean(state.company)
    },
    {
      id: "company.show-opportunities",
      entityType: "company",
      label: "Opportunités",
      description: "Voir les affaires commerciales liées.",
      icon: TrendingUp,
      priority: 20,
      onSelect: () => state.setActiveTab("opportunities"),
      available: Boolean(state.company)
    },
    {
      id: "company.show-quotes",
      entityType: "company",
      label: "Devis",
      description: "Consulter les devis liés à cette société.",
      icon: Receipt,
      priority: 30,
      onSelect: () => state.setActiveTab("quotes"),
      available: Boolean(state.company)
    },
    {
      id: "company.show-customers",
      entityType: "company",
      label: "Clients liés",
      description: "Vérifier les clients connectés au compte.",
      icon: UsersRound,
      priority: 40,
      onSelect: () => state.setActiveTab("customers"),
      available: Boolean(state.company)
    }
  ]);

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
      <ContextualActionStrip
        actions={contextualActions}
        description="Continuez depuis la société sans chercher le bon onglet."
      />
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
