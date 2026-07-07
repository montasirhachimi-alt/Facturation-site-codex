"use client";

import { Languages, Network, UserCheck, UsersRound } from "lucide-react";
import { EntityErrorState, EntityPagination, EntityStatsCards } from "@/ui";
import type { CompanyId } from "../../../companies/company.types";
import { ContactDialog } from "../dialogs/contact-dialog";
import { ContactsFilterSummary } from "../filters/contacts-filter-summary";
import { useCompanyContactsWorkspace } from "../hooks/use-company-contacts-workspace";
import { ContactsTable } from "../tables/contacts-table";
import { ContactsToolbar } from "../toolbar/contacts-toolbar";

export function CompanyContactsWorkspace({ companyId }: { companyId: CompanyId }) {
  const state = useCompanyContactsWorkspace(companyId);

  if (!state.readDecision.allowed) {
    return <EntityErrorState message="Accès refusé aux contacts de cette société." />;
  }

  return (
    <section className="space-y-4" aria-label="Contacts de la société">
      <EntityStatsCards
        metrics={[
          { icon: UsersRound, label: "Contacts", value: String(state.stats.total), helper: "Rattachés à cette société" },
          { icon: UserCheck, label: "Principaux", value: String(state.stats.primary), helper: "Contacts de référence" },
          { icon: UserCheck, label: "Décideurs", value: String(state.stats.decisionMakers), helper: "Décideurs identifiés" },
          { icon: Network, label: "Équipes", value: String(state.stats.departments), helper: "Départements représentés" },
          { icon: Languages, label: "Langues", value: String(state.stats.languages), helper: "Préférences de contact" }
        ]}
      />

      <ContactsToolbar
        canCreate={state.writeDecision.allowed}
        decisionMaker={state.decisionMaker}
        department={state.department}
        departmentOptions={state.departmentOptions}
        onCreate={state.openCreateDialog}
        onRefresh={state.refresh}
        onResetPage={() => state.setPage(1)}
        primary={state.primary}
        query={state.query}
        setDecisionMaker={state.setDecisionMaker}
        setDepartment={state.setDepartment}
        setPrimary={state.setPrimary}
        setQuery={state.setQuery}
        setStatus={state.setStatus}
        status={state.status}
      />

      <ContactsFilterSummary
        decisionMaker={state.decisionMaker}
        department={state.department}
        onClear={state.resetFilters}
        primary={state.primary}
        query={state.query}
        status={state.status}
      />

      <ContactsTable
        canCreate={state.writeDecision.allowed}
        canWrite={state.writeDecision.allowed}
        contacts={state.paginatedContacts.items}
        onArchive={state.archiveContact}
        onCreate={state.openCreateDialog}
        onEdit={state.openEditDialog}
        onSort={state.updateSort}
        onToggleAll={state.toggleAllVisible}
        onToggleRow={state.toggleRow}
        selectedIds={state.selectedIds}
        sort={state.sort}
      />

      <EntityPagination
        page={state.page}
        pageSize={state.pageSize}
        total={state.totalFiltered}
        hasNextPage={state.paginatedContacts.pagination.hasNextPage}
        hasPreviousPage={state.paginatedContacts.pagination.hasPreviousPage}
        onPageChange={state.setPage}
        onPageSizeChange={state.setPageSize}
      />

      <ContactDialog
        editing={Boolean(state.editingContact)}
        error={state.error}
        form={state.form}
        onChange={state.setForm}
        onClose={state.closeDialog}
        onSubmit={state.saveContact}
        open={state.dialogOpen}
      />
    </section>
  );
}
