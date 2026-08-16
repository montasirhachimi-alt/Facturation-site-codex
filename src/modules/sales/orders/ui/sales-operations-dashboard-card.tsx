"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, PackageCheck } from "lucide-react";
import { hydrateCrmSalesPersistence, hydrateDeliveryNotePersistence } from "@/platform/persistence";
import { ProductSectionHeader, SectionCard } from "@/ui";
import { DELIVERY_NOTES_WORKSPACE_ID, deliveryNoteService, getSalesOrderDeliveryProgress, subscribeToDeliveryNoteStore } from "../../delivery-notes";
import { SALES_ORDERS_WORKSPACE_ID } from "../order.constants";
import { salesOrderService, subscribeToSalesOrderStore } from "../order.store";
import type { SalesOrder } from "../order.types";

export type SalesOperationsDashboardCardVariant = "orders-to-confirm" | "orders-reserved" | "deliveries-to-prepare";

export function SalesOperationsDashboardCard({ variant }: { variant: SalesOperationsDashboardCardVariant }) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    void Promise.all([hydrateCrmSalesPersistence(), hydrateDeliveryNotePersistence()]);
    const unsubscribeOrders = subscribeToSalesOrderStore(() => setVersion((value) => value + 1));
    const unsubscribeDeliveries = subscribeToDeliveryNoteStore(() => setVersion((value) => value + 1));
    return () => {
      unsubscribeOrders();
      unsubscribeDeliveries();
    };
  }, []);

  const { draftDeliveryNotes, orders } = useMemo(() => {
    void version;
    return {
      orders: salesOrderService.listOrders({ workspaceId: SALES_ORDERS_WORKSPACE_ID, includeArchived: false }).orders,
      draftDeliveryNotes: deliveryNoteService.listDeliveryNotes({ workspaceId: DELIVERY_NOTES_WORKSPACE_ID, includeArchived: false }).deliveryNotes.filter((note) => note.status === "draft")
    };
  }, [version]);

  const model = useMemo(() => buildDashboardModel(variant, orders, draftDeliveryNotes.length), [draftDeliveryNotes.length, orders, variant]);
  const Icon = model.icon;

  return (
    <SectionCard className="p-4">
      <ProductSectionHeader icon={Icon} title={model.title} description={model.description} />
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-3xl font-bold text-hicotech-navy dark:text-white">{model.value}</p>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-300">{model.helper}</p>
        </div>
        <Link
          href={model.href}
          className="inline-flex items-center gap-1.5 rounded-xl bg-hicotech-navy px-3 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:bg-hicotech-blue focus:outline-none focus:ring-4 focus:ring-hicotech-blue/15"
        >
          Ouvrir
          <ArrowRight size={14} />
        </Link>
      </div>
      <div className="mt-4 space-y-2">
        {model.items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm transition hover:bg-hicotech-sky/50 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:bg-hicotech-dark-page/50"
          >
            <span className="min-w-0">
              <span className="block truncate font-bold text-hicotech-navy dark:text-white">{item.title}</span>
              <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500 dark:text-slate-300">{item.description}</span>
            </span>
            <span className="shrink-0 text-xs font-bold text-hicotech-blue">{item.meta}</span>
          </Link>
        ))}
        {model.items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-500 dark:border-hicotech-dark-border">
            {model.emptyMessage}
          </p>
        ) : null}
      </div>
    </SectionCard>
  );
}

function buildDashboardModel(variant: SalesOperationsDashboardCardVariant, orders: readonly SalesOrder[], draftDeliveryNoteCount: number) {
  if (variant === "orders-to-confirm") {
    const draftOrders = orders.filter((order) => order.status === "draft");
    return {
      icon: ClipboardCheck,
      title: "Commandes à confirmer",
      description: "Commandes client encore en brouillon.",
      value: String(draftOrders.length),
      helper: draftOrders.length > 0 ? "A valider avant reservation ou livraison." : "Aucune commande en attente.",
      href: "/sales/orders",
      emptyMessage: "Aucune commande client à confirmer.",
      items: draftOrders.slice(0, 3).map((order) => orderDashboardItem(order, "Brouillon"))
    };
  }

  if (variant === "orders-reserved") {
    const reservedOrders = orders.filter((order) => order.reservationStatus === "reserved" || order.reservationStatus === "partially_reserved");
    return {
      icon: CheckCircle2,
      title: "Commandes réservées",
      description: "Stock engagé avant préparation de livraison.",
      value: String(reservedOrders.length),
      helper: reservedOrders.length > 0 ? "A transformer en bon de livraison." : "Aucune reservation active.",
      href: "/sales/orders",
      emptyMessage: "Aucune commande avec stock réservé.",
      items: reservedOrders.slice(0, 3).map((order) => orderDashboardItem(order, order.reservationStatus === "reserved" ? "Réservée" : "Partielle"))
    };
  }

  const ordersToDeliver = orders.filter((order) => {
    if (["draft", "cancelled", "archived", "delivered"].includes(order.status)) return false;
    return getSalesOrderDeliveryProgress(order).quantityRemaining > 0;
  });

  return {
    icon: PackageCheck,
    title: "Livraisons à préparer",
    description: "Commandes confirmées avec reliquat à livrer.",
    value: String(ordersToDeliver.length + draftDeliveryNoteCount),
    helper: draftDeliveryNoteCount > 0 ? `${draftDeliveryNoteCount} bon(s) de livraison en brouillon.` : "Aucun bon en préparation.",
    href: "/sales/delivery-notes",
    emptyMessage: "Aucune livraison à préparer.",
    items: ordersToDeliver.slice(0, 3).map((order) => {
      const progress = getSalesOrderDeliveryProgress(order);
      return orderDashboardItem(order, `${progress.quantityRemaining} restant`);
    })
  };
}

function orderDashboardItem(order: SalesOrder, meta: string) {
  return {
    title: order.number,
    description: order.companyName,
    href: `/sales/orders/${order.id}`,
    meta
  };
}
