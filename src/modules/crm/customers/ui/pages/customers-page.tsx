"use client";

import { Building2, Clock3, Sparkles, UsersRound } from "lucide-react";
import { CustomerDialog } from "../dialogs/customer-dialog";
import { CustomersFilterSummary } from "../filters/customers-filter-summary";
import { useCustomersPage } from "../hooks/use-customers-page";
import { CustomersTable } from "../tables/customers-table";
import { CustomersToolbar } from "../toolbar/customers-toolbar";
import { CustomerStatCard } from "../components/customer-stat-card";

export function CustomersPage() {
  const state = useCustomersPage();

  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300" aria-label="Breadcrumb">
              <span>CRM</span>
              <span>/</span>
              <span className="text-hicotech-blue">Customers</span>
            </nav>
            <h1 className="mt-3 font-display text-2xl font-bold text-hicotech-navy dark:text-white md:text-3xl">Customers</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-300">
              Un portefeuille client professionnel, prêt pour les futures vues Companies, Contacts, Activities et Notes.
            </p>
          </div>
          <div className="rounded-lg bg-hicotech-sky px-4 py-3 text-sm font-bold text-hicotech-navy dark:bg-hicotech-blue/20 dark:text-white">
            Workspace actif : HicoPilot CRM
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <CustomerStatCard icon={UsersRound} label="Total clients" value={String(state.stats.total)} helper="Portefeuille visible" />
        <CustomerStatCard icon={Sparkles} label="Prospects" value={String(state.stats.leads)} helper="A convertir" />
        <CustomerStatCard icon={Building2} label="Sociétés" value={String(state.stats.companies)} helper="Comptes entreprise" />
        <CustomerStatCard icon={Clock3} label="Mis à jour" value={String(state.stats.updatedThisWeek)} helper="Cette semaine" />
        <CustomerStatCard icon={UsersRound} label="Actifs" value={String(state.stats.active)} helper="Clients opérationnels" />
      </section>

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

          <PaginationFooter
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
        <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
          Accès refusé au portefeuille clients.
        </section>
      )}

      <CustomerDialog
        error={state.error}
        form={state.form}
        onChange={state.setForm}
        onClose={state.closeDialog}
        onSubmit={state.createCustomer}
        open={state.dialogOpen}
      />
    </div>
  );
}

function PaginationFooter({
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  total
}: {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  page: number;
  pageSize: number;
  total: number;
}) {
  return (
    <footer className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card md:flex-row md:items-center md:justify-between">
      <p className="font-semibold text-slate-500 dark:text-slate-300">{total} résultat(s)</p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={pageSize}
          onChange={(event) => {
            onPageSizeChange(Number(event.target.value));
            onPageChange(1);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold text-hicotech-navy dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white"
          aria-label="Nombre de lignes par page"
        >
          <option value={5}>5 lignes</option>
          <option value={8}>8 lignes</option>
          <option value={12}>12 lignes</option>
        </select>
        <button type="button" disabled={!hasPreviousPage} onClick={() => onPageChange(Math.max(1, page - 1))} className="rounded-lg border border-slate-200 px-3 py-2 font-bold disabled:opacity-40 dark:border-hicotech-dark-border">
          Précédent
        </button>
        <span className="font-bold text-hicotech-navy dark:text-white">Page {page}</span>
        <button type="button" disabled={!hasNextPage} onClick={() => onPageChange(page + 1)} className="rounded-lg border border-slate-200 px-3 py-2 font-bold disabled:opacity-40 dark:border-hicotech-dark-border">
          Suivant
        </button>
      </div>
    </footer>
  );
}

