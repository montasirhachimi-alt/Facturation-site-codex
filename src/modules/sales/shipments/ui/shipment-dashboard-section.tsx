"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Truck } from "lucide-react";
import { ProductSectionHeader, SectionCard } from "@/ui";
import { hydrateShipmentPersistence } from "@/platform/persistence";
import { SHIPMENT_STATUS_LABELS, SHIPMENTS_WORKSPACE_ID, shipmentService, subscribeToShipmentStore } from "../index";
import { isShipmentDelayed } from "../shipment.utils";

export function ShipmentDashboardSection() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    void hydrateShipmentPersistence();
    return subscribeToShipmentStore(() => setVersion((value) => value + 1));
  }, []);

  const shipments = useMemo(() => {
    void version;
    return shipmentService.listShipments({ workspaceId: SHIPMENTS_WORKSPACE_ID }).shipments;
  }, [version]);

  const ready = shipments.filter((shipment) => shipment.status === "ready");
  const inTransit = shipments.filter((shipment) => shipment.status === "in_transit");
  const deliveredToday = shipments.filter((shipment) => shipment.status === "delivered" && shipment.updatedAt.slice(0, 10) === new Date().toISOString().slice(0, 10));
  const delayed = shipments.filter((shipment) => isShipmentDelayed(shipment));

  return (
    <SectionCard className="p-4">
      <ProductSectionHeader icon={Truck} title="Expéditions" description="Suivi logistique après bons de livraison." />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <DashboardShipmentMetric label="Prêtes à expédier" value={ready.length} />
        <DashboardShipmentMetric label="En transit" value={inTransit.length} />
        <DashboardShipmentMetric label="Livrées aujourd'hui" value={deliveredToday.length} />
        <DashboardShipmentMetric label="En retard" value={delayed.length} tone={delayed.length > 0 ? "alert" : "neutral"} />
      </div>
      <div className="mt-4 space-y-2">
        {shipments.slice(0, 3).map((shipment) => (
          <Link key={shipment.id} href={`/sales/shipments/${shipment.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm transition hover:bg-hicotech-sky/50 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:bg-hicotech-dark-page/50">
            <span className="font-bold text-hicotech-navy dark:text-white">{shipment.number}</span>
            <span className="text-xs font-bold text-slate-500">{SHIPMENT_STATUS_LABELS[shipment.status]}</span>
          </Link>
        ))}
        {shipments.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-500 dark:border-hicotech-dark-border">Aucune expédition à suivre.</p> : null}
      </div>
    </SectionCard>
  );
}

function DashboardShipmentMetric({ label, tone = "neutral", value }: { label: string; tone?: "neutral" | "alert"; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold ${tone === "alert" ? "text-red-600" : "text-hicotech-navy dark:text-white"}`}>{value}</p>
    </div>
  );
}
