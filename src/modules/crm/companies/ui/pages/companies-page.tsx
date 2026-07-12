"use client";

import { Building2, FileText, Globe2, Layers3, MapPinned } from "lucide-react";
import { useWorkspaceCreateShortcut } from "@/platform/keyboard";
import { EntityErrorState, EntityHeader, EntityPageLayout, EntityPagination, EntityStatsCards, InfoCard } from "@/ui";
import { CompanyDialog } from "../dialogs/company-dialog";
import { CompaniesFilterSummary } from "../filters/companies-filter-summary";
import { useCompaniesPage } from "../hooks/use-companies-page";
import { CompaniesTable } from "../tables/companies-table";
import { CompaniesToolbar } from "../toolbar/companies-toolbar";

export function CompaniesPage() {
  const state = useCompaniesPage();

  useWorkspaceCreateShortcut({
    enabled: state.writeDecision.allowed,
    label: "Ajouter une société",
    onCreate: state.openCreateDialog
  });

  return (
    <EntityPageLayout>
      <EntityHeader
        breadcrumb={["CRM", "Sociétés"]}
        title="Sociétés"
        description="Le centre de gravité CRM pour connecter contacts, devis, factures, paiements et suivi commercial."
        meta={<InfoCard>Espace actif : HicoPilot CRM</InfoCard>}
      />

      <EntityStatsCards
        metrics={[
          { icon: Building2, label: "Total sociétés", value: String(state.stats.total), helper: "Comptes visibles" },
          { icon: Layers3, label: "Actives", value: String(state.stats.active), helper: "Sociétés opérationnelles" },
          { icon: Globe2, label: "Industries", value: String(state.stats.industries), helper: "Segments couverts" },
          { icon: MapPinned, label: "Pays", value: String(state.stats.countries), helper: "Présence commerciale" },
          { icon: FileText, label: "Documents", value: "Ventes", helper: "Devis et factures liés" }
        ]}
      />

      <CompaniesToolbar
        canCreate={state.writeDecision.allowed}
        country={state.country}
        countryOptions={state.countryOptions}
        industry={state.industry}
        onCreate={state.openCreateDialog}
        onRefresh={state.refresh}
        onResetPage={state.resetPage}
        owner={state.owner}
        ownerOptions={state.ownerOptions}
        query={state.query}
        setCountry={state.setCountry}
        setIndustry={state.setIndustry}
        setOwner={state.setOwner}
        setQuery={state.setQuery}
        setStatus={state.setStatus}
        setTag={state.setTag}
        status={state.status}
        tag={state.tag}
        tagOptions={state.tagOptions}
      />

      <CompaniesFilterSummary
        country={state.country}
        industry={state.industry}
        owner={state.owner}
        query={state.query}
        status={state.status}
        tag={state.tag}
        onClear={() => {
          state.setQuery("");
          state.setIndustry("all");
          state.setStatus("all");
          state.setCountry("all");
          state.setOwner("all");
          state.setTag("all");
          state.resetPage();
        }}
      />

      {state.readDecision.allowed ? (
        <>
          <CompaniesTable
            canCreate={state.writeDecision.allowed}
            canWrite={state.writeDecision.allowed}
            companies={state.paginatedCompanies.items}
            onArchive={state.archiveCompany}
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
            hasNextPage={state.paginatedCompanies.pagination.hasNextPage}
            hasPreviousPage={state.paginatedCompanies.pagination.hasPreviousPage}
            onPageChange={state.setPage}
            onPageSizeChange={state.setPageSize}
          />
        </>
      ) : (
        <EntityErrorState message="Accès refusé au workspace sociétés." />
      )}

      <CompanyDialog
        error={state.error}
        form={state.form}
        onChange={state.setForm}
        onClose={state.closeDialog}
        onSubmit={state.saveCompany}
        open={state.dialogOpen}
        editing={Boolean(state.editingCompany)}
      />
    </EntityPageLayout>
  );
}
