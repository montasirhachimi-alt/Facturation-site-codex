"use client";

import { Building2, Clock3, FileText, Mail, Phone, Receipt, Sparkles, Tags, UsersRound, X } from "lucide-react";
import { useEffect } from "react";
import { ContextualActionStrip, useContextualActions } from "@/platform/contextual-actions";
import { useWorkspaceCreateShortcut } from "@/platform/keyboard";
import { EntityErrorState, EntityHeader, EntityPageLayout, EntityPagination, EntityStatsCards, InfoCard, SectionCard } from "@/ui";
import type { Customer } from "../../customer.types";
import { CustomerDialog } from "../dialogs/customer-dialog";
import { CustomersFilterSummary } from "../filters/customers-filter-summary";
import { useCustomersPage } from "../hooks/use-customers-page";
import { CustomersTable } from "../tables/customers-table";
import { CustomersToolbar } from "../toolbar/customers-toolbar";

export function CustomersPage() {
  const state = useCustomersPage();
  useWorkspaceCreateShortcut({
    enabled: state.createDecision.allowed,
    label: "Nouveau client",
    onCreate: state.openCreateDialog
  });

  const contextualActions = useContextualActions([
    {
      id: "customer.create",
      entityType: "customer",
      label: "Nouveau client",
      description: "Créer une fiche client depuis ce portefeuille.",
      icon: UsersRound,
      priority: 10,
      tone: "primary",
      onSelect: state.openCreateDialog,
      disabled: !state.createDecision.allowed,
      disabledReason: "Création client non autorisée."
    },
    {
      id: "customer.open-quotes",
      entityType: "customer",
      label: "Préparer un devis",
      description: "Continuer le flux commercial dans les devis.",
      icon: FileText,
      priority: 20,
      href: "/sales/quotes"
    },
    {
      id: "customer.open-invoices",
      entityType: "customer",
      label: "Préparer une facture",
      description: "Passer au suivi de facturation.",
      icon: Receipt,
      priority: 30,
      href: "/sales/invoices"
    }
  ]);

  return (
    <EntityPageLayout>
      <EntityHeader
        breadcrumb={["CRM", "Clients"]}
        title="Clients"
        description="Un portefeuille client professionnel pour suivre les relations, statuts et informations commerciales clés."
        meta={<InfoCard>Espace actif : HicoPilot CRM</InfoCard>}
      />

      <ContextualActionStrip
        actions={contextualActions}
        description="Depuis le portefeuille clients, lancez l'action commerciale la plus probable."
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
            onEdit={state.openEditDialog}
            onSort={state.updateSort}
            onToggleAll={state.toggleAllVisible}
            onToggleRow={state.toggleRow}
            onView={state.openViewDialog}
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
        editing={Boolean(state.editingCustomer)}
        error={state.error}
        form={state.form}
        onChange={state.setForm}
        onClose={state.closeDialog}
        onSubmit={state.saveCustomer}
        open={state.dialogOpen}
      />

      <CustomerDetailDialog customer={state.viewingCustomer} onClose={state.closeViewDialog} onEdit={state.openEditDialog} />
    </EntityPageLayout>
  );
}

function CustomerDetailDialog({
  customer,
  onClose,
  onEdit
}: {
  customer: Customer | null;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
}) {
  useEffect(() => {
    if (!customer) return undefined;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [customer, onClose]);

  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-hicotech-dark-sidebar/65 px-4 py-6 backdrop-blur-sm" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-detail-title"
        className="w-full max-w-3xl rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_28px_90px_rgba(10,30,63,0.24)] dark:border-hicotech-dark-border dark:bg-hicotech-dark-card"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-hicotech-dark-border">
          <div>
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-hicotech-blue">Fiche client</p>
            <h2 id="customer-detail-title" className="mt-1.5 font-display text-xl font-bold text-hicotech-navy dark:text-white">{customer.displayName}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">{customer.companyName ?? "Client sans société associée"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-hicotech-navy transition hover:bg-hicotech-cloud focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white"
            aria-label="Fermer la fiche client"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <CustomerInfo icon={UsersRound} label="Statut" value={customer.status} />
          <CustomerInfo icon={Building2} label="Type" value={customer.type === "company" ? "Société" : "Particulier"} />
          <CustomerInfo icon={Mail} label="Email" value={customer.email ?? "-"} />
          <CustomerInfo icon={Phone} label="Téléphone" value={customer.phone ?? "-"} />
          <CustomerInfo icon={Clock3} label="Mis à jour" value={formatCustomerDate(customer.updatedAt)} />
          <CustomerInfo icon={Tags} label="Tags" value={customer.tags.length ? customer.tags.join(", ") : "-"} />
        </div>

        {customer.notes && (
          <SectionCard className="mt-4 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">Notes</p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{customer.notes}</p>
          </SectionCard>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 dark:border-hicotech-dark-border sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-hicotech-navy transition hover:bg-hicotech-cloud focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(customer);
            }}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(13,110,253,0.18)] transition hover:-translate-y-0.5 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/20"
          >
            Modifier
          </button>
        </div>
      </section>
    </div>
  );
}

function CustomerInfo({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-hicotech-dark-border dark:bg-slate-900/30">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-hicotech-blue" aria-hidden="true" />
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">{label}</p>
      </div>
      <p className="mt-1.5 text-sm font-bold text-hicotech-navy dark:text-white">{value}</p>
    </div>
  );
}

function formatCustomerDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
