"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, PackageCheck, Route, Truck } from "lucide-react";
import { DELIVERY_NOTES_WORKSPACE_ID, deliveryNoteService, subscribeToDeliveryNoteStore } from "@/modules/sales/delivery-notes";
import { SALES_ORDERS_WORKSPACE_ID, salesOrderService, subscribeToSalesOrderStore } from "@/modules/sales/orders";
import { hydrateCrmSalesPersistence, hydrateDeliveryNotePersistence, hydrateShipmentPersistence, transitionPersistedShipmentStatus } from "@/platform/persistence";
import { MetricCard, ProductSectionHeader, SectionCard } from "@/ui";
import { SHIPMENT_STATUS_LABELS, SHIPMENT_TIMELINE_STEPS, SHIPMENTS_WORKSPACE_ID, shipmentService, subscribeToShipmentStore } from "../index";
import type { Shipment, ShipmentId, ShipmentStatus } from "../shipment.types";
import { getShipmentQuantity, getShipmentStatusRank, isShipmentDelayed } from "../shipment.utils";
import { ShipmentBadge } from "./shipments-workspace";

const nextStatusByStatus: Partial<Record<ShipmentStatus, ShipmentStatus>> = {
  draft: "ready",
  ready: "shipped",
  shipped: "in_transit",
  in_transit: "delivered"
};

export function ShipmentDetailsWorkspace({ shipmentId }: { shipmentId: string }) {
  const [version, setVersion] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([hydrateCrmSalesPersistence(), hydrateDeliveryNotePersistence(), hydrateShipmentPersistence()]);
    const refresh = () => setVersion((value) => value + 1);
    const unsubscribers = [subscribeToShipmentStore(refresh), subscribeToDeliveryNoteStore(refresh), subscribeToSalesOrderStore(refresh)];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  const shipment = useMemo(() => {
    void version;
    return shipmentService.getShipment(shipmentId as ShipmentId, SHIPMENTS_WORKSPACE_ID);
  }, [shipmentId, version]);
  const deliveryNote = shipment ? deliveryNoteService.getDeliveryNote(shipment.deliveryNoteId, DELIVERY_NOTES_WORKSPACE_ID) : undefined;
  const salesOrder = shipment ? salesOrderService.getOrder(shipment.salesOrderId, SALES_ORDERS_WORKSPACE_ID) : undefined;

  if (!shipment) {
    return (
      <main className="min-h-screen bg-hicotech-cloud px-4 py-4 dark:bg-hicotech-dark-page lg:px-6">
        <SectionCard className="p-6 text-center">
          <p className="font-display text-xl font-bold text-hicotech-navy dark:text-white">Expédition introuvable.</p>
          <Link href="/sales/shipments" className="mt-4 inline-flex rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white">Retour aux expéditions</Link>
        </SectionCard>
      </main>
    );
  }

  const shipmentValue = shipment;
  const nextStatus = nextStatusByStatus[shipmentValue.status];

  async function updateStatus(status: ShipmentStatus) {
    try {
      await transitionPersistedShipmentStatus(shipmentValue.id, status);
      setMessage(`Statut mis à jour : ${SHIPMENT_STATUS_LABELS[status]}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Le statut n'a pas pu être mis à jour.");
    }
  }

  return (
    <main className="min-h-screen bg-hicotech-cloud px-4 py-4 dark:bg-hicotech-dark-page lg:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <Link href="/sales/shipments" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-hicotech-blue focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10">
          <ArrowLeft size={16} /> Expéditions
        </Link>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-hicotech-blue">Expédition</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-hicotech-navy dark:text-white">{shipmentValue.number}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{shipmentValue.companyName} · {shipmentValue.carrier} · {shipmentValue.trackingNumber ?? "Sans suivi"}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ShipmentBadge status={shipmentValue.status} />
              {isShipmentDelayed(shipmentValue) ? <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">En retard</span> : null}
            </div>
            {message ? <p role="status" className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">{message}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {nextStatus ? (
              <button type="button" onClick={() => updateStatus(nextStatus)} title={`Passer au statut ${SHIPMENT_STATUS_LABELS[nextStatus]}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/20">
                <CheckCircle2 size={16} /> {SHIPMENT_STATUS_LABELS[nextStatus]}
              </button>
            ) : null}
            {shipmentValue.status !== "cancelled" && shipmentValue.status !== "delivered" ? (
              <button type="button" onClick={() => updateStatus("cancelled")} title="Annuler l'expédition" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:text-slate-300">
                Annuler
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-3 md:grid-cols-4">
        <MetricCard icon={Truck} label="Transporteur" value={shipmentValue.carrier} helper={shipmentValue.trackingNumber ?? "Suivi non renseigné"} />
        <MetricCard icon={Route} label="Livraison prévue" value={shipmentValue.expectedDelivery ? new Date(shipmentValue.expectedDelivery).toLocaleDateString("fr-MA") : "-"} helper="Engagement transport" />
        <MetricCard icon={PackageCheck} label="Quantités" value={String(getShipmentQuantity(shipmentValue))} helper="Depuis le BL posté" />
        <MetricCard icon={Truck} label="Statut" value={SHIPMENT_STATUS_LABELS[shipmentValue.status]} helper="Cycle logistique" />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <SectionCard className="p-4">
          <ProductSectionHeader icon={Route} title="Timeline d'expédition" description="Progression logistique sans impact sur l'inventaire." />
          <ShipmentTimeline shipment={shipmentValue} />
        </SectionCard>

        <SectionCard className="p-4">
          <ProductSectionHeader icon={Truck} title="Informations transport" description="Références utilisées par l'équipe logistique." />
          <div className="mt-4 space-y-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <InfoRow label="Client" value={shipmentValue.companyName} href={`/crm/companies/${shipmentValue.companyId}`} />
            <InfoRow label="Contact" value={shipmentValue.contactName ?? "-"} />
            <InfoRow label="Adresse de livraison" value={shipmentValue.deliveryAddress ?? "Adresse non renseignée"} />
            <InfoRow label="Bon de livraison" value={shipmentValue.deliveryNoteNumber} href={`/sales/delivery-notes/${shipmentValue.deliveryNoteId}`} />
            <InfoRow label="Commande client" value={shipmentValue.salesOrderNumber} href={`/sales/orders/${shipmentValue.salesOrderId}`} />
            <InfoRow label="Date d'expédition" value={new Date(shipmentValue.shipmentDate).toLocaleDateString("fr-MA")} />
          </div>
        </SectionCard>
      </section>

      <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="p-4 pb-0">
          <ProductSectionHeader icon={PackageCheck} title="Produits expédiés" description="Quantités reprises depuis le bon de livraison." />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-hicotech-dark-page/40">
              <tr>
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Quantité</th>
                <th className="px-4 py-3">Unité</th>
              </tr>
            </thead>
            <tbody>
              {shipmentValue.lines.map((line) => (
                <tr key={line.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                  <td className="px-4 py-3 font-bold text-hicotech-navy dark:text-white">{line.productSku ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{line.description}</td>
                  <td className="px-4 py-3 text-right font-bold text-hicotech-navy dark:text-white">{line.quantity}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{line.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {shipmentValue.notes ? (
        <SectionCard className="mt-4 p-4">
          <ProductSectionHeader icon={Truck} title="Notes logistiques" description="Instructions et contexte de livraison." />
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">{shipmentValue.notes}</p>
        </SectionCard>
      ) : null}

      {deliveryNote || salesOrder ? null : (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">Certains documents liés ne sont pas chargés dans cette session.</p>
      )}
    </main>
  );
}

function ShipmentTimeline({ shipment }: { shipment: Shipment }) {
  const currentRank = getShipmentStatusRank(shipment.status);
  return (
    <ol className="mt-4 space-y-3">
      {SHIPMENT_TIMELINE_STEPS.map((step, index) => {
        const reached = currentRank >= index;
        const current = shipment.status === step.status;
        return (
          <li key={step.status} className={`rounded-xl border px-3 py-3 ${current ? "border-hicotech-blue bg-hicotech-sky/40" : reached ? "border-emerald-200 bg-emerald-50/60 dark:bg-emerald-500/10" : "border-slate-200 bg-white dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/35"}`}>
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-black ${reached ? "bg-hicotech-blue text-white" : "bg-slate-100 text-slate-400"}`}>{index + 1}</span>
              <div>
                <p className="font-display text-sm font-bold text-hicotech-navy dark:text-white">{step.label}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{step.description}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function InfoRow({ href, label, value }: { href?: string; label: string; value: string }) {
  return (
    <p className="flex items-start justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      {href ? <Link href={href} className="text-right font-bold text-hicotech-blue">{value}</Link> : <span className="text-right text-hicotech-navy dark:text-white">{value}</span>}
    </p>
  );
}
