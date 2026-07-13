"use client";

import { useState } from "react";
import { Archive, Boxes, CircleAlert, ClipboardList, Edit3, MoveRight, PackageCheck, Plus, RotateCw, Search, Warehouse as WarehouseIcon } from "lucide-react";
import { clsx } from "clsx";
import { refreshInventoryPersistence, persistInventoryOperation } from "@/platform/persistence/inventory-persistence.client";
import { useInventoryWorkspace, formatInventoryQuantity, movementTypeLabel, type InventoryOperationMode, type InventoryTab, type MovementRow, type StockRow } from "../hooks/use-inventory-workspace";
import { InventoryOperationDialog } from "../dialogs/inventory-operation-dialog";
import { ReservationDialog } from "../dialogs/reservation-dialog";
import { WarehouseDialog } from "../dialogs/warehouse-dialog";
import type { InventoryMovementType, Warehouse } from "../../inventory.types";

const tabs = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "stock", label: "Stock" },
  { id: "warehouses", label: "Entrepôts" },
  { id: "movements", label: "Mouvements" },
  { id: "reservations", label: "Réservations" }
] satisfies readonly { id: InventoryTab; label: string }[];

const movementTypes = [
  "RECEIPT",
  "ISSUE",
  "TRANSFER",
  "ADJUSTMENT_IN",
  "ADJUSTMENT_OUT",
  "RESERVATION",
  "RELEASE"
] satisfies readonly InventoryMovementType[];

export function InventoryWorkspace() {
  const workspace = useInventoryWorkspace();
  const [operationMode, setOperationMode] = useState<InventoryOperationMode | null>(null);
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [reservationDialog, setReservationDialog] = useState<null | { mode: "reserve" | "release"; initialValues?: Record<string, string> }>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    setNotice(null);
    try {
      await refreshInventoryPersistence();
      setNotice({ tone: "success", message: "Stock actualisé." });
    } catch (caught) {
      setNotice({ tone: "error", message: caught instanceof Error ? caught.message : "Actualisation impossible." });
    } finally {
      setRefreshing(false);
    }
  }

  async function archiveWarehouse(warehouse: Warehouse) {
    const confirmed = window.confirm(`Archiver l'entrepôt ${warehouse.name} ?`);
    if (!confirmed) return;
    setNotice(null);
    try {
      await persistInventoryOperation("archiveWarehouse", { warehouseId: warehouse.id });
      setNotice({ tone: "success", message: "Entrepôt archivé." });
    } catch (caught) {
      setNotice({ tone: "error", message: caught instanceof Error ? caught.message : "Archivage impossible." });
    }
  }

  function openWarehouseDialog(warehouse?: Warehouse) {
    setEditingWarehouse(warehouse ?? null);
    setWarehouseDialogOpen(true);
  }

  return (
    <main className="min-h-screen bg-slate-50/70 px-4 py-5 text-hicotech-navy dark:bg-hicotech-dark-page dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
        <section className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(10,30,63,0.08)] dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
          <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-hicotech-blue">Inventaire</p>
              <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-hicotech-navy dark:text-white">Stock opérationnel</h1>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500 dark:text-slate-300">
                Surveillez les disponibilités, les entrepôts et les mouvements postés sans contourner le moteur d&apos;inventaire.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setOperationMode("receipt")} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(13,110,253,0.18)] transition hover:-translate-y-0.5 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/20">
                <Plus size={16} /> Réception
              </button>
              <button type="button" onClick={() => setOperationMode("transfer")} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-hicotech-navy transition hover:bg-hicotech-cloud focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
                <MoveRight size={16} /> Transfert
              </button>
              <button type="button" onClick={refresh} disabled={refreshing} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-hicotech-cloud focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 disabled:opacity-60 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-slate-200">
                <RotateCw size={16} className={clsx(refreshing && "animate-spin")} /> Actualiser
              </button>
            </div>
          </div>
          <div className="border-t border-slate-200 px-5 pb-4 pt-3 dark:border-hicotech-dark-border">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button key={tab.id} type="button" onClick={() => workspace.setActiveTab(tab.id)} className={clsx("rounded-xl px-3 py-2 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10", workspace.activeTab === tab.id ? "bg-hicotech-navy text-white dark:bg-white dark:text-hicotech-navy" : "text-slate-500 hover:bg-slate-100 hover:text-hicotech-navy dark:hover:bg-white/10 dark:hover:text-white")}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {notice && (
          <div className={clsx("rounded-2xl border px-4 py-3 text-sm font-bold", notice.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200" : "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200")}>
            {notice.message}
          </div>
        )}

        {workspace.activeTab === "overview" && <InventoryOverview workspace={workspace} onOperation={setOperationMode} onCreateWarehouse={() => openWarehouseDialog()} />}
        {workspace.activeTab === "stock" && <StockSection workspace={workspace} />}
        {workspace.activeTab === "warehouses" && <WarehouseSection workspace={workspace} onArchive={archiveWarehouse} onCreate={() => openWarehouseDialog()} onEdit={openWarehouseDialog} />}
        {workspace.activeTab === "movements" && <MovementsSection workspace={workspace} onOperation={setOperationMode} />}
        {workspace.activeTab === "reservations" && <ReservationsSection workspace={workspace} onCreate={() => setReservationDialog({ mode: "reserve" })} onRelease={(row) => setReservationDialog({
          mode: "release",
          initialValues: {
            productId: row.movement.productId,
            productLabel: row.product?.name ?? "",
            warehouseId: row.movement.toWarehouseId ?? row.movement.fromWarehouseId ?? "",
            reference: row.movement.reference ?? "",
            referenceId: row.movement.referenceId ?? "",
            referenceType: row.movement.referenceType ?? "MANUAL",
            reason: row.movement.reason ?? ""
          }
        })} />}
      </div>

      <WarehouseDialog
        open={warehouseDialogOpen}
        warehouse={editingWarehouse}
        onClose={() => setWarehouseDialogOpen(false)}
        onSaved={(message) => setNotice({ tone: "success", message })}
      />
      <InventoryOperationDialog
        open={Boolean(operationMode)}
        mode={operationMode}
        productItems={workspace.productItems}
        warehouses={workspace.warehouses}
        onClose={() => setOperationMode(null)}
        onSaved={(message) => setNotice({ tone: "success", message })}
      />
      <ReservationDialog
        open={Boolean(reservationDialog)}
        mode={reservationDialog?.mode ?? "reserve"}
        initialValues={reservationDialog?.initialValues}
        productItems={workspace.productItems}
        warehouses={workspace.warehouses}
        balances={workspace.stockRows.map((row) => row.balance)}
        onClose={() => setReservationDialog(null)}
        onSaved={(message) => setNotice({ tone: "success", message })}
      />
    </main>
  );
}

function InventoryOverview({ onCreateWarehouse, onOperation, workspace }: { onCreateWarehouse: () => void; onOperation: (mode: InventoryOperationMode) => void; workspace: ReturnType<typeof useInventoryWorkspace> }) {
  const kpis = [
    { label: "Produits suivis", value: workspace.kpis.trackedProducts, icon: PackageCheck },
    { label: "En main", value: formatInventoryQuantity(workspace.kpis.quantityOnHand), icon: PackageCheck },
    { label: "Disponible", value: formatInventoryQuantity(workspace.kpis.quantityAvailable), icon: Boxes },
    { label: "Réservé", value: formatInventoryQuantity(workspace.kpis.quantityReserved), icon: ClipboardList },
    { label: "Projeté", value: formatInventoryQuantity(workspace.kpis.quantityProjected), icon: MoveRight },
    { label: "Stock faible", value: workspace.kpis.lowStock, icon: CircleAlert },
    { label: "Entrepôts actifs", value: workspace.kpis.activeWarehouses, icon: WarehouseIcon }
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{kpi.label}</p>
                <p className="mt-2 font-display text-2xl font-black text-hicotech-navy dark:text-white">{kpi.value}</p>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-hicotech-blue/10 text-hicotech-blue"><kpi.icon size={18} /></span>
            </div>
          </div>
        ))}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <h2 className="font-display text-lg font-black">Actions stock</h2>
        <div className="mt-4 grid gap-2">
          <ActionButton label="Réception manuelle" onClick={() => onOperation("receipt")} />
          <ActionButton label="Sortie manuelle" onClick={() => onOperation("issue")} />
          <ActionButton label="Transfert" onClick={() => onOperation("transfer")} />
          <ActionButton label="Ajustement" onClick={() => onOperation("adjustment")} />
          <ActionButton label="Nouvel entrepôt" onClick={onCreateWarehouse} secondary />
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card xl:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-black">Réservations récentes</h2>
            <p className="mt-0.5 text-sm font-medium text-slate-500 dark:text-slate-300">Réservations et libérations postées par le moteur d&apos;inventaire.</p>
          </div>
          <StatusBadge label={`${workspace.reservationRows.length} mouvements`} tone="muted" />
        </div>
        <div className="mt-4 grid gap-2">
          {workspace.reservationRows.map((row) => (
            <div key={row.movement.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40">
              <div>
                <p className="text-sm font-black text-hicotech-navy dark:text-white">{row.product?.name ?? "Produit inconnu"}</p>
                <p className="text-xs font-semibold text-slate-400">{formatMovementWarehouses(row)} · {formatDate(row.movement.postedAt ?? row.movement.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge label={movementTypeLabel(row.movement.type)} tone={row.movement.type === "RESERVATION" ? "warning" : "ok"} />
                <span className="font-display text-sm font-black">{formatInventoryQuantity(row.movement.quantity)}</span>
              </div>
            </div>
          ))}
          {workspace.reservationRows.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-sm font-semibold text-slate-500 dark:border-hicotech-dark-border dark:text-slate-300">Aucune réservation postée pour le moment.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function StockSection({ workspace }: { workspace: ReturnType<typeof useInventoryWorkspace> }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <SectionToolbar title="Stock disponible" description="Solde par produit et entrepôt.">
        <SearchControl value={workspace.stockQuery} onChange={workspace.setStockQuery} placeholder="Produit, SKU, entrepôt..." />
        <WarehouseFilter value={workspace.stockWarehouseId} onChange={workspace.setStockWarehouseId} warehouses={workspace.warehouses} />
        <button type="button" onClick={() => workspace.setLowOnly(!workspace.lowOnly)} className={clsx("rounded-xl px-3 py-2 text-sm font-bold transition", workspace.lowOnly ? "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-100" : "border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-hicotech-dark-border dark:text-slate-300 dark:hover:bg-white/10")}>
          Stock faible
        </button>
      </SectionToolbar>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-hicotech-dark-border">
          <thead className="bg-slate-50 text-left text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 dark:bg-hicotech-dark-page/40">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Entrepôt</th>
              <th className="px-4 py-3 text-right">En main</th>
              <th className="px-4 py-3 text-right">Réservé</th>
              <th className="px-4 py-3 text-right">Disponible</th>
              <th className="px-4 py-3">Seuil</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-hicotech-dark-border/70">
            {workspace.filteredStockRows.map((row) => <StockTableRow key={row.id} row={row} />)}
          </tbody>
        </table>
        {workspace.filteredStockRows.length === 0 && <EmptyState title="Aucun solde de stock" description="Postez une réception ou un ajustement pour créer le premier solde." />}
      </div>
    </section>
  );
}

function WarehouseSection({ onArchive, onCreate, onEdit, workspace }: { onArchive: (warehouse: Warehouse) => void; onCreate: () => void; onEdit: (warehouse: Warehouse) => void; workspace: ReturnType<typeof useInventoryWorkspace> }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <SectionToolbar title="Entrepôts" description="Emplacements actifs ou archivés, avec résumé de stock.">
        <button type="button" onClick={onCreate} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(13,110,253,0.18)]">
          <Plus size={16} /> Nouvel entrepôt
        </button>
      </SectionToolbar>
      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
        {workspace.warehouses.map((warehouse) => {
          const balances = workspace.stockRows.filter((row) => row.balance.warehouseId === warehouse.id);
          return (
            <article key={warehouse.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/35">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{warehouse.code}</p>
                  <h3 className="mt-1 font-display text-lg font-black text-hicotech-navy dark:text-white">{warehouse.name}</h3>
                </div>
                <StatusBadge label={warehouse.active ? warehouse.isDefault ? "Par défaut" : "Actif" : "Archivé"} tone={warehouse.active ? "ok" : "muted"} />
              </div>
              {warehouse.description && <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-300">{warehouse.description}</p>}
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <MiniStat label="Produits" value={balances.length} />
                <MiniStat label="Disponible" value={formatInventoryQuantity(balances.reduce((total, row) => total + row.balance.quantityAvailable, 0))} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => onEdit(warehouse)} className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-hicotech-navy transition hover:bg-hicotech-cloud dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-white">
                  <Edit3 size={14} /> Modifier
                </button>
                {warehouse.active && (
                  <button type="button" onClick={() => onArchive(warehouse)} className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-red-50 hover:text-red-700 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-slate-300">
                    <Archive size={14} /> Archiver
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {workspace.warehouses.length === 0 && <EmptyState title="Aucun entrepôt" description="Créez un entrepôt pour commencer à poster des mouvements de stock." />}
    </section>
  );
}

function MovementsSection({ onOperation, workspace }: { onOperation: (mode: InventoryOperationMode) => void; workspace: ReturnType<typeof useInventoryWorkspace> }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <SectionToolbar title="Historique des mouvements" description="Mouvements postés par le moteur d'inventaire.">
        <SearchControl value={workspace.movementQuery} onChange={workspace.setMovementQuery} placeholder="Produit, référence, raison..." />
        <WarehouseFilter value={workspace.movementWarehouseId} onChange={workspace.setMovementWarehouseId} warehouses={workspace.warehouses} />
        <select value={workspace.movementType} onChange={(event) => workspace.setMovementType(event.target.value as InventoryMovementType | "all")} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-hicotech-navy outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
          <option value="all">Tous les types</option>
          {movementTypes.map((type) => <option key={type} value={type}>{movementTypeLabel(type)}</option>)}
        </select>
        <button type="button" onClick={() => onOperation("adjustment")} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(13,110,253,0.18)]">
          <Plus size={16} /> Ajustement
        </button>
      </SectionToolbar>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-hicotech-dark-border">
          <thead className="bg-slate-50 text-left text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 dark:bg-hicotech-dark-page/40">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Entrepôts</th>
              <th className="px-4 py-3 text-right">Quantité</th>
              <th className="px-4 py-3">Référence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-hicotech-dark-border/70">
            {workspace.filteredMovementRows.map((row) => <MovementTableRow key={row.movement.id} row={row} />)}
          </tbody>
        </table>
        {workspace.filteredMovementRows.length === 0 && <EmptyState title="Aucun mouvement" description="Postez une réception, une sortie, un transfert ou un ajustement." />}
      </div>
    </section>
  );
}

function ReservationsSection({ onCreate, onRelease, workspace }: { onCreate: () => void; onRelease: (row: MovementRow) => void; workspace: ReturnType<typeof useInventoryWorkspace> }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <SectionToolbar title="Réservations" description="Vue QA des réservations et libérations postées par le moteur d'inventaire.">
        <SearchControl value={workspace.reservationQuery} onChange={workspace.setReservationQuery} placeholder="Produit, SKU, référence..." />
        <WarehouseFilter value={workspace.reservationWarehouseId} onChange={workspace.setReservationWarehouseId} warehouses={workspace.warehouses} />
        <select value={workspace.reservationType} onChange={(event) => workspace.setReservationType(event.target.value as "all" | "RESERVATION" | "RELEASE")} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-hicotech-navy outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
          <option value="all">Tous les types</option>
          <option value="RESERVATION">Réservations</option>
          <option value="RELEASE">Libérations</option>
        </select>
        <button type="button" onClick={onCreate} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(13,110,253,0.18)]">
          <Plus size={16} /> Nouvelle réservation
        </button>
      </SectionToolbar>

      <div className="grid gap-3 border-b border-slate-200 p-4 dark:border-hicotech-dark-border md:grid-cols-4">
        <MiniStat label="En main" value={formatInventoryQuantity(workspace.kpis.quantityOnHand)} />
        <MiniStat label="Réservé" value={formatInventoryQuantity(workspace.kpis.quantityReserved)} />
        <MiniStat label="Disponible" value={formatInventoryQuantity(workspace.kpis.quantityAvailable)} />
        <MiniStat label="Projeté" value={formatInventoryQuantity(workspace.kpis.quantityProjected)} />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-hicotech-dark-border">
          <thead className="bg-slate-50 text-left text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 dark:bg-hicotech-dark-page/40">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Entrepôt</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Quantité</th>
              <th className="px-4 py-3">Référence</th>
              <th className="px-4 py-3">Motif</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-hicotech-dark-border/70">
            {workspace.filteredReservationRows.map((row) => <ReservationTableRow key={row.movement.id} row={row} onRelease={onRelease} />)}
          </tbody>
        </table>
        {workspace.filteredReservationRows.length === 0 && <EmptyState title="Aucune réservation" description="Créez une réservation manuelle pour valider le moteur avant les futures intégrations commerciales." />}
      </div>
    </section>
  );
}

function SectionToolbar({ children, description, title }: { children: React.ReactNode; description: string; title: string }) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-hicotech-dark-border xl:flex-row xl:items-center xl:justify-between">
      <div>
        <h2 className="font-display text-lg font-black text-hicotech-navy dark:text-white">{title}</h2>
        <p className="mt-0.5 text-sm font-medium text-slate-500 dark:text-slate-300">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function SearchControl({ onChange, placeholder, value }: { onChange: (value: string) => void; placeholder: string; value: string }) {
  return (
    <label className="relative min-w-[16rem] flex-1 xl:flex-none">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-bold text-hicotech-navy outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" />
    </label>
  );
}

function WarehouseFilter({ onChange, value, warehouses }: { onChange: (value: string) => void; value: string; warehouses: readonly Warehouse[] }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-hicotech-navy outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
      <option value="all">Tous les entrepôts</option>
      {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} · {warehouse.name}</option>)}
    </select>
  );
}

function StockTableRow({ row }: { row: StockRow }) {
  return (
    <tr className="transition hover:bg-hicotech-cloud/60 dark:hover:bg-white/5">
      <td className="px-4 py-3">
        <p className="font-bold text-hicotech-navy dark:text-white">{row.product?.name ?? "Produit inconnu"}</p>
        <p className="mt-0.5 text-xs font-semibold text-slate-400">{row.product?.sku ?? row.balance.productId}</p>
      </td>
      <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">{row.warehouse?.name ?? "Entrepôt inconnu"}</td>
      <td className="px-4 py-3 text-right font-bold">{formatInventoryQuantity(row.balance.quantityOnHand)}</td>
      <td className="px-4 py-3 text-right font-bold">{formatInventoryQuantity(row.balance.quantityReserved)}</td>
      <td className="px-4 py-3 text-right font-black text-hicotech-navy dark:text-white">{formatInventoryQuantity(row.balance.quantityAvailable)}</td>
      <td className="px-4 py-3 font-semibold text-slate-500">{row.balance.reorderPoint > 0 ? formatInventoryQuantity(row.balance.reorderPoint) : "Non défini"}</td>
      <td className="px-4 py-3"><StatusBadge label={row.status === "out" ? "Rupture" : row.status === "low" ? "Stock faible" : "OK"} tone={row.status === "ok" ? "ok" : row.status === "low" ? "warning" : "danger"} /></td>
    </tr>
  );
}

function MovementTableRow({ row }: { row: MovementRow }) {
  return (
    <tr className="transition hover:bg-hicotech-cloud/60 dark:hover:bg-white/5">
      <td className="px-4 py-3 font-semibold text-slate-500">{formatDate(row.movement.postedAt ?? row.movement.createdAt)}</td>
      <td className="px-4 py-3"><StatusBadge label={movementTypeLabel(row.movement.type)} tone="muted" /></td>
      <td className="px-4 py-3">
        <p className="font-bold text-hicotech-navy dark:text-white">{row.product?.name ?? "Produit inconnu"}</p>
        <p className="text-xs font-semibold text-slate-400">{row.product?.sku ?? row.movement.productId}</p>
      </td>
      <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">{formatMovementWarehouses(row)}</td>
      <td className="px-4 py-3 text-right font-black">{formatInventoryQuantity(row.movement.quantity)}</td>
      <td className="px-4 py-3 font-semibold text-slate-500">{row.movement.reference ?? row.movement.reason ?? "Sans référence"}</td>
    </tr>
  );
}

function ReservationTableRow({ onRelease, row }: { onRelease: (row: MovementRow) => void; row: MovementRow }) {
  const warehouse = row.toWarehouse ?? row.fromWarehouse;
  return (
    <tr className="transition hover:bg-hicotech-cloud/60 dark:hover:bg-white/5">
      <td className="px-4 py-3 font-semibold text-slate-500">{formatDate(row.movement.postedAt ?? row.movement.createdAt)}</td>
      <td className="px-4 py-3">
        <p className="font-bold text-hicotech-navy dark:text-white">{row.product?.name ?? "Produit inconnu"}</p>
        <p className="text-xs font-semibold text-slate-400">{row.product?.sku ?? row.movement.productId}</p>
      </td>
      <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">{warehouse?.name ?? "Entrepôt inconnu"}</td>
      <td className="px-4 py-3"><StatusBadge label={movementTypeLabel(row.movement.type)} tone={row.movement.type === "RESERVATION" ? "warning" : "ok"} /></td>
      <td className="px-4 py-3 text-right font-black">{formatInventoryQuantity(row.movement.quantity)}</td>
      <td className="px-4 py-3 font-semibold text-slate-500">{formatReservationReference(row)}</td>
      <td className="px-4 py-3 font-semibold text-slate-500">{row.movement.reason ?? "Sans motif"}</td>
      <td className="px-4 py-3 text-right">
        {row.movement.type === "RESERVATION" ? (
          <button type="button" onClick={() => onRelease(row)} className="inline-flex min-h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-hicotech-navy transition hover:bg-hicotech-cloud focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
            Libérer
          </button>
        ) : (
          <span className="text-xs font-bold text-slate-400">Traité</span>
        )}
      </td>
    </tr>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: "ok" | "warning" | "danger" | "muted" }) {
  const className = {
    danger: "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-200",
    muted: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-200",
    ok: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200",
    warning: "bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-100"
  }[tone];
  return <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-xs font-black", className)}>{label}</span>;
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 font-display text-lg font-black text-hicotech-navy dark:text-white">{value}</p>
    </div>
  );
}

function ActionButton({ label, onClick, secondary = false }: { label: string; onClick: () => void; secondary?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={clsx("flex min-h-10 items-center justify-between rounded-xl px-3 py-2 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10", secondary ? "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-hicotech-dark-border dark:text-slate-300 dark:hover:bg-white/10" : "bg-hicotech-navy text-white hover:-translate-y-0.5 dark:bg-white dark:text-hicotech-navy")}>
      {label}
      <MoveRight size={15} />
    </button>
  );
}

function EmptyState({ description, title }: { description: string; title: string }) {
  return (
    <div className="grid place-items-center px-6 py-12 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-hicotech-blue/10 text-hicotech-blue"><Boxes size={22} /></div>
      <h3 className="mt-3 font-display text-lg font-black text-hicotech-navy dark:text-white">{title}</h3>
      <p className="mt-1 max-w-md text-sm font-medium leading-6 text-slate-500 dark:text-slate-300">{description}</p>
    </div>
  );
}

function formatMovementWarehouses(row: MovementRow) {
  if (row.movement.type === "TRANSFER") return `${row.fromWarehouse?.name ?? "Source"} → ${row.toWarehouse?.name ?? "Destination"}`;
  if (row.toWarehouse) return row.toWarehouse.name;
  if (row.fromWarehouse) return row.fromWarehouse.name;
  return "Non renseigné";
}

function formatReservationReference(row: MovementRow) {
  const type = row.movement.referenceType ? referenceTypeLabel(row.movement.referenceType) : "Manuelle";
  const reference = row.movement.reference ?? row.movement.referenceId;
  return reference ? `${type} · ${reference}` : type;
}

function referenceTypeLabel(type: string) {
  const labels: Record<string, string> = {
    ADJUSTMENT: "Ajustement",
    DELIVERY: "Livraison",
    MANUAL: "Manuelle",
    QUOTE: "Devis",
    SALES_ORDER: "Commande client"
  };
  return labels[type] ?? "Référence";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
