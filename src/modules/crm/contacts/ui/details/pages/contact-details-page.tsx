"use client";

import { EntityEmptyState, EntityErrorState, EntityPageLayout } from "@/ui";
import { Building2, CalendarClock, FileText, NotebookPen, UserRound } from "lucide-react";
import { ContactActivitiesPanel } from "../widgets/contact-activities-panel";
import { CrmMeetingsWorkspace, CrmNotesWorkspace, CrmTasksWorkspace } from "@/modules/crm/activities/ui/crm-activity-workspaces";
import { ContactQuotesPanel } from "@/modules/sales/quotes/ui";
import { ContactInvoicesPanel } from "@/modules/sales/invoices/ui";
import { ContextualActionStrip, useContextualActions } from "@/platform/contextual-actions";
import { ContactDetailsHeader } from "../components/contact-details-header";
import { ContactDetailsTabs } from "../components/contact-details-tabs";
import { ContactInspectorPanel } from "../components/contact-inspector-panel";
import { ContactOverview } from "../components/contact-overview";
import { ContactPlaceholderTab } from "../components/contact-placeholder-tab";
import { ContactSummaryCards } from "../components/contact-summary-cards";
import { useContactDetails } from "../hooks/use-contact-details";
import { ContactDialog } from "../../dialogs/contact-dialog";

export function ContactDetailsPage({ contactId }: { contactId: string }) {
  const state = useContactDetails(contactId);
  const contextualActions = useContextualActions([
    {
      id: "contact.open-company",
      entityType: "contact",
      label: "Ouvrir la société",
      description: "Revenir au compte CRM associé.",
      icon: Building2,
      priority: 10,
      tone: "primary",
      href: state.company ? `/crm/companies/${state.company.id}` : undefined,
      disabled: !state.company,
      disabledReason: "Aucune société liée à ce contact.",
      available: Boolean(state.contact)
    },
    {
      id: "contact.show-quotes",
      entityType: "contact",
      label: "Devis",
      description: "Consulter les devis de ce contact.",
      icon: FileText,
      priority: 30,
      onSelect: () => state.setActiveTab("quotes"),
      available: Boolean(state.contact)
    },
    {
      id: "contact.show-meetings",
      entityType: "contact",
      label: "Réunions",
      description: "Préparer le prochain échange.",
      icon: CalendarClock,
      priority: 40,
      onSelect: () => state.setActiveTab("meetings"),
      available: Boolean(state.contact)
    },
    {
      id: "contact.show-notes",
      entityType: "contact",
      label: "Notes",
      description: "Retrouver le contexte relationnel.",
      icon: NotebookPen,
      priority: 50,
      onSelect: () => state.setActiveTab("notes"),
      available: Boolean(state.contact)
    }
  ]);

  if (!state.canRead) {
    return (
      <EntityPageLayout>
        <EntityErrorState message="Accès refusé au workspace contact." />
      </EntityPageLayout>
    );
  }

  if (!state.contact) {
    return (
      <EntityPageLayout>
        <EntityEmptyState icon={UserRound} title="Contact introuvable" description="Ce contact n'existe pas dans le workspace actif." />
      </EntityPageLayout>
    );
  }

  const contact = state.contact;

  return (
    <EntityPageLayout>
      <ContactDetailsHeader canWrite={state.canWrite} company={state.company} contact={contact} onEdit={() => state.openEditDialog(contact)} />
      <ContextualActionStrip
        actions={contextualActions}
        description="Passez naturellement du contact vers la société, les ventes ou le suivi relationnel."
      />
      <ContactSummaryCards summary={state.summary} />
      <ContactDetailsTabs activeTab={state.activeTab} onChange={state.setActiveTab} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-4">
          {state.activeTab === "overview" ? (
            <>
              <ContactOverview company={state.company} contact={contact} />
              <ContactQuotesPanel contactId={contact.id} />
              <ContactInvoicesPanel contactId={contact.id} />
              <ContactActivitiesPanel activities={state.activities} filters={state.activityFilters} onFiltersChange={state.setActivityFilters} />
            </>
          ) : state.activeTab === "quotes" ? (
            <ContactQuotesPanel contactId={contact.id} />
          ) : state.activeTab === "invoices" ? (
            <ContactInvoicesPanel contactId={contact.id} />
          ) : state.activeTab === "activities" ? (
            <ContactActivitiesPanel activities={state.activities} filters={state.activityFilters} onFiltersChange={state.setActivityFilters} />
          ) : state.activeTab === "meetings" ? (
            <CrmMeetingsWorkspace companyId={contact.companyId} contactId={contact.id} embedded />
          ) : state.activeTab === "tasks" ? (
            <CrmTasksWorkspace companyId={contact.companyId} contactId={contact.id} embedded />
          ) : state.activeTab === "notes" ? (
            <CrmNotesWorkspace companyId={contact.companyId} contactId={contact.id} embedded />
          ) : (
            <ContactPlaceholderTab label={state.activeTab} />
          )}
        </main>
        <ContactInspectorPanel company={state.company} contact={contact} />
      </div>

      <ContactDialog
        editing={Boolean(state.editingContact)}
        error={state.error}
        form={state.form}
        onChange={state.setForm}
        onClose={state.closeDialog}
        onSubmit={state.saveContact}
        open={state.dialogOpen}
      />
    </EntityPageLayout>
  );
}
