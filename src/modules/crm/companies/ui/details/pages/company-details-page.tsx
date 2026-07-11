"use client";

import { EntityEmptyState, EntityErrorState, EntityPageLayout } from "@/ui";
import { Building2, ContactRound, Receipt, TrendingUp } from "lucide-react";
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
import { CompanyDialog } from "../../dialogs/company-dialog";
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
      label: "Factures",
      description: "Consulter les factures liées à cette société.",
      icon: Receipt,
      priority: 40,
      onSelect: () => state.setActiveTab("invoices"),
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

  const company = state.company;

  return (
    <EntityPageLayout>
      <CompanyDetailsHeader canWrite={state.canWrite} company={company} onEdit={() => state.openEditDialog(company)} />
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
                <CompanyActivityTimeline companyId={company.id} />
                <div className="space-y-4">
                  <CompanyNotesPanel />
                  <CompanyTasksWidget />
                </div>
              </div>
              <CompanyOverview company={company} />
            </>
          ) : state.activeTab === "contacts" ? (
            <CompanyContactsWorkspace companyId={company.id} />
          ) : state.activeTab === "opportunities" ? (
            <CompanyOpportunitiesPanel companyId={company.id} />
          ) : state.activeTab === "quotes" ? (
            <CompanyQuotesPanel companyId={company.id} />
          ) : state.activeTab === "invoices" ? (
            <CompanyInvoicesPanel companyId={company.id} />
          ) : (
            <CompanyPlaceholderTab label={state.activeTab} />
          )}
        </main>
        <CompanyInspectorPanel />
      </div>
      <CompanyDialog
        editing={Boolean(state.editingCompany)}
        error={state.error}
        form={state.form}
        onChange={state.setForm}
        onClose={state.closeDialog}
        onSubmit={state.saveCompany}
        open={state.dialogOpen}
      />
    </EntityPageLayout>
  );
}
