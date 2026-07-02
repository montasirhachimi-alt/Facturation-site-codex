"use client";

import { EntityEmptyState, EntityErrorState, EntityPageLayout } from "@/ui";
import { UserRound } from "lucide-react";
import { ContactActivitiesPanel } from "../widgets/contact-activities-panel";
import { ContactMeetingsPanel } from "@/modules/crm/meetings/ui/contact-meetings-panel";
import { ContactTasksPanel } from "@/modules/crm/tasks/ui/contact-tasks-panel";
import { ContactDetailsHeader } from "../components/contact-details-header";
import { ContactDetailsTabs } from "../components/contact-details-tabs";
import { ContactInspectorPanel } from "../components/contact-inspector-panel";
import { ContactOverview } from "../components/contact-overview";
import { ContactPlaceholderTab } from "../components/contact-placeholder-tab";
import { ContactSummaryCards } from "../components/contact-summary-cards";
import { useContactDetails } from "../hooks/use-contact-details";

export function ContactDetailsPage({ contactId }: { contactId: string }) {
  const state = useContactDetails(contactId);

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

  return (
    <EntityPageLayout>
      <ContactDetailsHeader canWrite={state.canWrite} company={state.company} contact={state.contact} />
      <ContactSummaryCards summary={state.summary} />
      <ContactDetailsTabs activeTab={state.activeTab} onChange={state.setActiveTab} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-6">
          {state.activeTab === "overview" ? (
            <>
              <ContactOverview company={state.company} contact={state.contact} />
              <ContactActivitiesPanel activities={state.activities} filters={state.activityFilters} onFiltersChange={state.setActivityFilters} />
            </>
          ) : state.activeTab === "activities" ? (
            <ContactActivitiesPanel activities={state.activities} filters={state.activityFilters} onFiltersChange={state.setActivityFilters} />
          ) : state.activeTab === "meetings" ? (
            <ContactMeetingsPanel meetings={state.meetings} filters={state.meetingFilters} onFiltersChange={state.setMeetingFilters} />
          ) : state.activeTab === "tasks" ? (
            <ContactTasksPanel tasks={state.tasks} filters={state.taskFilters} onFiltersChange={state.setTaskFilters} />
          ) : (
            <ContactPlaceholderTab label={state.activeTab} />
          )}
        </main>
        <ContactInspectorPanel company={state.company} contact={state.contact} />
      </div>
    </EntityPageLayout>
  );
}
