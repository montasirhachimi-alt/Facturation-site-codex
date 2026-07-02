"use client";

import { Building2, Clock3, Sparkles, UsersRound } from "lucide-react";
import { EntityErrorState, EntityHeader, EntityPageLayout, EntityPagination, EntityStatsCards, InfoCard } from "@/ui";
import { CustomerDialog } from "../dialogs/customer-dialog";
import { CustomersFilterSummary } from "../filters/customers-filter-summary";
import { useCustomersPage } from "../hooks/use-customers-page";
import { CustomersTable } from "../tables/customers-table";
import { CustomersToolbar } from "../toolbar/customers-toolbar";

export function CustomersPage() {
  const state = useCustomersPage();

  return (
    <EntityPageLayout>
      <EntityHeader
        breadcrumb={["CRM", "Clients"]}
        title="Clients"
        description="Un portefeuille client professionnel, prêt pour les futures vues sociétés, contacts, activités et notes."
        meta={<InfoCard>Espace actif : HicoPilot CRM</InfoCard>}
      />

      <EntityStatsCards
        metrics={[
          { icon: UsersRound, label: "Total clients", value: String(state.stats.total), helper: "Portefeuille visible" },
          { icon: Sparkles, label: "Prospects", value: String(state.stats.leads), helper: "A convertir" },
          { icon: Building2, label: "Sociétés", value: String(state.stats.companies), helper: "Comptes entreprise" },
          { icon: Clock3, label: "Mis à jour", value: String(state.stats.updatedThisWeek), helper: "Cette semaine" },
          { icon: UsersRound, label: "Actifs", value: String(state.stats.active), helper: "Clients opérationnels" }
        ]}
      />

      <CustomersToolbar
        canCreate={state.createDecision.allowed}
        onCreate={state.openCreateDialog}
        onRefresh={state.refresh}
        onResetPage={state.resetPage}
        query={state.query}
        setQuery={state.setQuery}
        setStatus={state.setStatus}
        setTag={state.setTag}
        setType={state.setType}
        status={state.status}
        tag={state.tag}
        tagOptions={state.tagOptions}
        type={state.type}
      />

      <CustomersFilterSummary
        query={state.query}
        status={state.status}
        tag={state.tag}
        type={state.type}
        onClear={() => {
          state.setQuery("");
          state.setStatus("all");
          state.setType("all");
          state.setTag("all");
          state.resetPage();
        }}
      />

      {state.readDecision.allowed ? (
        <>
          <CustomersTable
            canCreate={state.createDecision.allowed}
            canEdit={state.editDecision.allowed}
            customers={state.paginatedCustomers.items}
            onArchive={state.archiveCustomer}
            onCreate={state.openCreateDialog}
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
            hasNextPage={state.paginatedCustomers.pagination.hasNextPage}
            hasPreviousPage={state.paginatedCustomers.pagination.hasPreviousPage}
            onPageChange={state.setPage}
            onPageSizeChange={state.setPageSize}
          />
        </>
      ) : (
        <EntityErrorState message="Accès refusé au portefeuille clients." />
      )}

      <CustomerDialog
        error={state.error}
        form={state.form}
        onChange={state.setForm}
        onClose={state.closeDialog}
        onSubmit={state.createCustomer}
        open={state.dialogOpen}
      />
    </EntityPageLayout>
  );
}
