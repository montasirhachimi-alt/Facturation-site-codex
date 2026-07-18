"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TimelineEvent } from "@/runtime/timeline";
import { TimelineService } from "@/services/timeline";
import { BusinessTimeline } from "@/ui/timeline";

type TimelineLoader = (salesOrderId: string) => Promise<readonly TimelineEvent[]>;

type SalesOrderBusinessTimelineProps = {
  salesOrderId: string;
  refreshKey?: string | number;
  loadTimeline?: TimelineLoader;
};

const timelineService = new TimelineService();

export function SalesOrderBusinessTimeline({
  salesOrderId,
  refreshKey,
  loadTimeline = loadSalesOrderTimeline
}: SalesOrderBusinessTimelineProps) {
  const [events, setEvents] = useState<readonly TimelineEvent[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setStatus("loading");
    setError(null);
    setEvents([]);

    loadTimeline(salesOrderId)
      .then((nextEvents) => {
        if (cancelled || requestId !== requestIdRef.current) return;
        setEvents(nextEvents);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled || requestId !== requestIdRef.current) return;
        setEvents([]);
        setError("Impossible de charger l'historique de cette commande.");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [loadTimeline, refreshKey, retryToken, salesOrderId]);

  const description = useMemo(() => {
    if (status === "loading") return "Chargement de l'historique commercial et logistique.";
    if (status === "error") return error ?? "Historique indisponible.";
    return "Parcours commercial, réservations, livraisons et mouvements physiques reliés.";
  }, [error, status]);

  return (
    <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card" data-testid="sales-order-business-timeline">
      {status === "loading" ? (
        <TimelineLoadingState />
      ) : status === "error" ? (
        <TimelineErrorState message={description} onRetry={() => setRetryToken((value) => value + 1)} />
      ) : (
        <BusinessTimeline
          description={description}
          emptyMessage="Aucune activité disponible pour cette commande."
          events={events}
          title="Historique de l'activité"
        />
      )}
    </section>
  );
}

function loadSalesOrderTimeline(salesOrderId: string) {
  return timelineService.getTimeline({
    entityType: "sales.order",
    entityId: salesOrderId
  });
}

function TimelineLoadingState() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-3" role="status">
      <div>
        <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Historique de l&apos;activité</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Chargement de l&apos;historique commercial et logistique.</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/30">
        {[0, 1, 2].map((item) => (
          <div key={item} className="mb-2 rounded-lg border border-slate-100 bg-white px-4 py-3 last:mb-0 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
            <div className="h-4 w-2/5 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
            <div className="mt-3 h-3 w-4/5 animate-pulse rounded-full bg-slate-100 dark:bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="status" data-testid="sales-order-business-timeline-error">
      <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Historique de l&apos;activité</h2>
      <div className="mt-3 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold">{message}</p>
        <button className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-100" onClick={onRetry} type="button">
          Réessayer
        </button>
      </div>
    </div>
  );
}
