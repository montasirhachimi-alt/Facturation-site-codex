"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Eye, Plus, Truck } from "lucide-react";
import { CRM_COMPANIES_WORKSPACE_ID } from "@/modules/crm/companies/ui/companies.seed";
import { crmCompanyLocalService, subscribeToCrmCompanyStore } from "@/modules/crm/companies/ui/company-local-store";
import { DELIVERY_NOTES_WORKSPACE_ID, deliveryNoteService, subscribeToDeliveryNoteStore } from "@/modules/sales/delivery-notes";
import { hydrateCrmSalesPersistence, hydrateDeliveryNotePersistence, hydrateShipmentPersistence, persistShipmentRecord } from "@/platform/persistence";
import { SHIPMENT_STATUS_BADGE_CLASSNAMES, SHIPMENT_STATUS_LABELS, SHIPMENTS_USER_ID, SHIPMENTS_WORKSPACE_ID, notifyShipmentStoreUpdated, shipmentService, subscribeToShipmentStore } from "../index";
import type { Shipment } from "../shipment.types";
import { createShipmentLinesFromDeliveryNote, isShipmentDelayed, shipmentCanBeCreatedFromDeliveryNote } from "../shipment.utils";
import { ShipmentDialog, type ShipmentFormState } from "./shipment-dialog";

const pageSize = 8;

function today() {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm: ShipmentFormState = {
  deliveryNoteId: "",
  carrier: "",
  trackingNumber: "",
  shipmentDate: today(),
  expectedDelivery: "",
  notes: ""
};

export function ShipmentsWorkspace() {
  const autoOpened = useRef(false);
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [carrier, setCarrier] = useState("all");
  const [companyId, setCompanyId] = useState("all");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ShipmentFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([hydrateCrmSalesPersistence(), hydrateDeliveryNotePersistence(), hydrateShipmentPersistence()]);
    const refresh = () => setVersion((value) => value + 1);
    const unsubscribers = [subscribeToShipmentStore(refresh), subscribeToDeliveryNoteStore(refresh), subscribeToCrmCompanyStore(refresh)];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  const shipments = useMemo(() => {
    void version;
    return shipmentService.listShipments({
      workspaceId: SHIPMENTS_WORKSPACE_ID,
      query,
      status: status as never,
      carrier: carrier === "all" ? undefined : carrier,
      companyId: companyId as never,
      date: date || undefined
    }).shipments;
  }, [carrier, companyId, date, query, status, version]);

  const postedDeliveryNotes = useMemo(() => {
    void version;
    const existing = shipmentService.listShipments({ workspaceId: SHIPMENTS_WORKSPACE_ID }).shipments;
    return deliveryNoteService
      .listDeliveryNotes({ workspaceId: DELIVERY_NOTES_WORKSPACE_ID, status: "posted", includeArchived: false })
      .deliveryNotes.filter((note) => shipmentCanBeCreatedFromDeliveryNote(note, existing));
  }, [version]);

  const companies = useMemo(() => {
    void version;
    return crmCompanyLocalService.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID, includeArchived: false }).companies;
  }, [version]);

  const carriers = useMemo(() => {
    void version;
    const values = shipmentService.listShipments({ workspaceId: SHIPMENTS_WORKSPACE_ID }).shipments.map((shipment) => shipment.carrier).filter(Boolean);
    return [...new Set(values)].sort((left, right) => left.localeCompare(right));
  }, [version]);

  const totalPages = Math.max(1, Math.ceil(shipments.length / pageSize));
  const visibleShipments = shipments.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => setPage(1), [carrier, companyId, date, query, status]);

  useEffect(() => {
    if (autoOpened.current || postedDeliveryNotes.length === 0) return;
    const deliveryNoteId = new URLSearchParams(window.location.search).get("deliveryNoteId");
    if (!deliveryNoteId || !postedDeliveryNotes.some((note) => note.id === deliveryNoteId)) return;
    autoOpened.current = true;
    setForm({ ...emptyForm, deliveryNoteId });
    setError(null);
    setSuccess(null);
    setDialogOpen(true);
  }, [postedDeliveryNotes]);

  function openCreate(deliveryNoteId?: string) {
    setForm({ ...emptyForm, deliveryNoteId: deliveryNoteId ?? postedDeliveryNotes[0]?.id ?? "" });
    setError(null);
    setSuccess(null);
    setDialogOpen(true);
  }

  function changeDeliveryNote(deliveryNoteId: string) {
    setForm({ ...form, deliveryNoteId });
  }

  function clearFilters() {
    setQuery("");
    setStatus("all");
    setCarrier("all");
    setCompanyId("all");
    setDate("");
  }

  async function submitShipment() {
    const note = postedDeliveryNotes.find((item) => item.id === form.deliveryNoteId);
    if (!note) {
      setError("Sélectionnez un bon de livraison posté et non encore expédié.");
      return false;
    }
    const company = crmCompanyLocalService.getCompany(note.companyId, CRM_COMPANIES_WORKSPACE_ID);
    const result = shipmentService.createShipment({
      workspaceId: SHIPMENTS_WORKSPACE_ID,
      deliveryNoteId: note.id,
      deliveryNoteNumber: note.number,
      salesOrderId: note.salesOrderId,
      salesOrderNumber: note.salesOrderNumber,
      companyId: note.companyId,
      companyName: note.companyName,
      contactId: note.contactId,
      contactName: note.contactName,
      deliveryAddress: company?.address,
      carrier: form.carrier,
      trackingNumber: form.trackingNumber,
      shipmentDate: new Date(form.shipmentDate || today()).toISOString(),
      expectedDelivery: form.expectedDelivery ? new Date(form.expectedDelivery).toISOString() : undefined,
      notes: form.notes,
      lines: createShipmentLinesFromDeliveryNote(note.lines),
      ownerId: SHIPMENTS_USER_ID
    });
    if (!result.shipment) {
      setError(result.error ?? "Impossible de créer l'expédition.");
      return false;
    }
    notifyShipmentStoreUpdated();
    try {
      await persistShipmentRecord(result.shipment);
      setDialogOpen(false);
      setSuccess("Expédition créée.");
      return true;
    } catch (error) {
      shipmentService.replaceShipments(shipmentService.listShipments({ workspaceId: SHIPMENTS_WORKSPACE_ID }).shipments.filter((shipment) => shipment.id !== result.shipment?.id));
      notifyShipmentStoreUpdated();
      setError(error instanceof Error ? error.message : "Impossible d'enregistrer l'expédition.");
      return false;
    }
  }

  return (
    <main className="min-h-screen bg-hicotech-cloud px-4 py-4 dark:bg-hicotech-dark-page lg:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-hicotech-blue">Ventes · Logistique</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-hicotech-navy dark:text-white">Expéditions</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-300">Organisez le transport après les bons de livraison postés. L&apos;inventaire reste géré uniquement par les BL.</p>
            {success ? <p role="status" className="mt-2 text-sm font-bold text-emerald-700">{success}</p> : null}
          </div>
          <button type="button" onClick={() => openCreate()} disabled={postedDeliveryNotes.length === 0} title={postedDeliveryNotes.length === 0 ? "Aucun bon de livraison posté disponible" : "Créer une expédition"} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/20 disabled:cursor-not-allowed disabled:opacity-50">
            <Plus size={16} /> Créer une expédition
          </button>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px_180px_200px_160px_auto]">
          <input className={controlClassName} placeholder="Rechercher une expédition, société, transporteur..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <select aria-label="Filtrer par statut" className={controlClassName} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Tous les statuts</option>
            {Object.entries(SHIPMENT_STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <select aria-label="Filtrer par transporteur" className={controlClassName} value={carrier} onChange={(event) => setCarrier(event.target.value)}>
            <option value="all">Tous les transporteurs</option>
            {carriers.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select aria-label="Filtrer par client" className={controlClassName} value={companyId} onChange={(event) => setCompanyId(event.target.value)}>
            <option value="all">Toutes les sociétés</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.displayName}</option>)}
          </select>
          <input aria-label="Filtrer par date d'expédition" type="date" className={controlClassName} value={date} onChange={(event) => setDate(event.target.value)} />
          <button type="button" onClick={clearFilters} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-hicotech-navy transition hover:border-hicotech-blue/30 hover:bg-hicotech-sky/50 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:text-white">Effacer</button>
        </div>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ShipmentMetric label="Prêtes à expédier" value={shipments.filter((shipment) => shipment.status === "ready").length} />
        <ShipmentMetric label="En transit" value={shipments.filter((shipment) => shipment.status === "in_transit").length} />
        <ShipmentMetric label="Livrées aujourd'hui" value={shipments.filter((shipment) => shipment.status === "delivered" && shipment.updatedAt.slice(0, 10) === today()).length} />
        <ShipmentMetric label="En retard" value={shipments.filter((shipment) => isShipmentDelayed(shipment)).length} />
      </section>

      <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        {visibleShipments.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-hicotech-dark-page/40">
                  <tr>
                    <th className="px-4 py-3">Expédition</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Transporteur</th>
                    <th className="px-4 py-3">Suivi</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Expédition</th>
                    <th className="px-4 py-3">Livraison prévue</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>{visibleShipments.map((shipment) => <ShipmentRow key={shipment.id} shipment={shipment} />)}</tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm font-semibold text-slate-500 dark:border-hicotech-dark-border">
              <span>{shipments.length} expédition(s)</span>
              <div className="flex items-center gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className={paginationClassName}>Précédent</button>
                <span>Page {page} / {totalPages}</span>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className={paginationClassName}>Suivant</button>
              </div>
            </div>
          </>
        ) : (
          <div className="grid place-items-center px-6 py-14 text-center">
            <Truck className="text-hicotech-blue" size={30} />
            <h2 className="mt-3 font-display text-lg font-bold text-hicotech-navy dark:text-white">Aucune expédition.</h2>
            <p className="mt-1 max-w-md text-sm text-slate-500">Créez une expédition depuis un bon de livraison posté pour suivre le transport sans modifier l&apos;inventaire.</p>
          </div>
        )}
      </section>

      <ShipmentDialog error={error} form={form} onChange={setForm} onClose={() => setDialogOpen(false)} onDeliveryNoteChange={changeDeliveryNote} onSubmit={submitShipment} open={dialogOpen} postedDeliveryNotes={postedDeliveryNotes} />
    </main>
  );
}

function ShipmentRow({ shipment }: { shipment: Shipment }) {
  return (
    <tr className="border-t border-slate-100 transition hover:bg-slate-50/70 dark:border-hicotech-dark-border dark:hover:bg-hicotech-dark-page/40">
      <td className="px-4 py-3 font-bold text-hicotech-navy dark:text-white">
        <Link href={`/sales/shipments/${shipment.id}`} className="hover:text-hicotech-blue">{shipment.number}</Link>
        <p className="text-xs font-medium text-slate-500">{shipment.deliveryNoteNumber}</p>
      </td>
      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{shipment.companyName}</td>
      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{shipment.carrier}</td>
      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{shipment.trackingNumber ?? "-"}</td>
      <td className="px-4 py-3"><ShipmentBadge status={shipment.status} /></td>
      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{new Date(shipment.shipmentDate).toLocaleDateString("fr-MA")}</td>
      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{shipment.expectedDelivery ? new Date(shipment.expectedDelivery).toLocaleDateString("fr-MA") : "-"}</td>
      <td className="px-4 py-3 text-right">
        <Link href={`/sales/shipments/${shipment.id}`} aria-label="Voir les détails" title="Voir les détails" className="inline-grid size-9 place-items-center rounded-lg border border-slate-200 text-hicotech-navy transition hover:border-hicotech-blue/30 hover:bg-hicotech-sky/50 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:text-white">
          <Eye size={15} />
        </Link>
      </td>
    </tr>
  );
}

export function ShipmentBadge({ status }: { status: Shipment["status"] }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${SHIPMENT_STATUS_BADGE_CLASSNAMES[status]}`}>{SHIPMENT_STATUS_LABELS[status]}</span>;
}

function ShipmentMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <p className="text-[11px] font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-display text-xl font-bold text-hicotech-navy dark:text-white">{value}</p>
    </div>
  );
}

export function ShipmentSummaryLink({ shipment }: { shipment: Shipment }) {
  return (
    <Link href={`/sales/shipments/${shipment.id}`} className="inline-flex items-center gap-1 text-sm font-bold text-hicotech-blue">
      {shipment.number}
      <ArrowRight size={14} />
    </Link>
  );
}

const controlClassName = "rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none transition focus:border-hicotech-blue focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white";
const paginationClassName = "rounded-lg border border-slate-200 px-3 py-1.5 font-bold transition hover:border-hicotech-blue/30 hover:bg-hicotech-sky/50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-hicotech-dark-border";
