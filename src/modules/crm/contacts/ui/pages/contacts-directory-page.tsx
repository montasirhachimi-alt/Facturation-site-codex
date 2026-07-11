"use client";

import { Building2, ContactRound, UsersRound } from "lucide-react";
import { EntityErrorState, EntityHeader, EntityPageLayout, EntityPagination, EntityStatsCards, FormSection } from "@/ui";
import { SmartEntityPicker } from "@/ui/forms/smart-entity-picker";
import { getCompanyPickerItems } from "@/ui/forms/entity-picker.crm-data";
import { ContactDialog } from "../dialogs/contact-dialog";
import { ContactsFilterSummary } from "../filters/contacts-filter-summary";
import { useGlobalContactsDirectory } from "../hooks/use-global-contacts-directory";
import { ContactsTable } from "../tables/contacts-table";
import { ContactsToolbar } from "../toolbar/contacts-toolbar";

export function ContactsDirectoryPage() {
  const state = useGlobalContactsDirectory();
  const companyPickerItems = getCompanyPickerItems();

  return (
    <EntityPageLayout>
      <EntityHeader
        breadcrumb={["CRM", "Contacts"]}
        title="Contacts"
        description="Répertoire unique des interlocuteurs CRM, synchronisé avec les fiches sociétés."
      />

      <EntityStatsCards
        metrics={[
          { icon: UsersRound, label: "Contacts", value: String(state.stats.total), helper: "répertoire global" },
          { icon: ContactRound, label: "Actifs", value: String(state.stats.active), helper: "joignables" },
          { icon: Building2, label: "Sociétés", value: String(state.stats.companies), helper: "comptes liés" },
          { icon: UsersRound, label: "Décideurs", value: String(state.stats.decisionMakers), helper: "influence achat" }
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

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">Société</label>
        <select
          value={state.companyId}
          onChange={(event) => {
            state.setCompanyId(event.target.value as typeof state.companyId);
            state.setPage(1);
          }}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-hicotech-navy outline-none transition focus:border-hicotech-blue focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page dark:text-white"
        >
          <option value="all">Toutes sociétés</option>
          {state.companies.map((company) => <option key={company.id} value={company.id}>{company.displayName}</option>)}
        </select>
      </div>

      <ContactsFilterSummary
        decisionMaker={state.decisionMaker}
        department={state.department}
        primary={state.primary}
        query={state.query}
        status={state.status}
        onClear={state.resetFilters}
      />

      {state.readDecision.allowed ? (
        <>
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
            emptyTitle="Aucun contact dans le répertoire"
            emptyDescription="Créez un contact depuis une société, Quick Create ou ce répertoire. Il apparaîtra partout dans le CRM."
            subtitle="Contacts persistés, partagés par les sociétés, les détails contact et les formulaires commerciaux."
            title="Répertoire des contacts"
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
        </>
      ) : (
        <EntityErrorState message="Accès refusé au répertoire contacts." />
      )}

      <ContactDialog
        editing={Boolean(state.editingContact)}
        error={state.error}
        form={state.form}
        onChange={state.setForm}
        onClose={state.closeDialog}
        onSubmit={state.saveContact}
        open={state.dialogOpen}
        relationshipField={
          <FormSection title="Société liée" description="Un contact CRM appartient toujours à une société.">
            <SmartEntityPicker
              label="Société"
              items={companyPickerItems}
              value={companyPickerItems.find((item) => item.relations?.companyId === state.formCompanyId)?.title ?? ""}
              onChange={({ item }) => state.setFormCompanyId((item?.relations?.companyId ?? "") as typeof state.formCompanyId)}
              placeholder="Rechercher une société..."
              helper="Obligatoire"
            />
          </FormSection>
        }
      />
    </EntityPageLayout>
  );
}
