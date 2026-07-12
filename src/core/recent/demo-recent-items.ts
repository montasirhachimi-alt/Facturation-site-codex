import { registerRecent } from "./recent.registry";
import type { RecentItemInput } from "./recent.types";

export const demoRecentItems: RecentItemInput[] = [
  {
    id: "recent-invoice-f-2026-154",
    targetId: "invoice-f-2026-154",
    targetType: "invoice",
    moduleId: "invoices",
    title: "Invoice F-2026-154",
    subtitle: "ABC SARL · 12 500 MAD",
    icon: "Receipt",
    color: "blue",
    lastOpened: "2026-06-29T09:14:00.000Z",
    openCount: 5,
    favorite: true
  },
  {
    id: "recent-client-abc-sarl",
    targetId: "client-abc-sarl",
    targetType: "client",
    moduleId: "clients",
    title: "ABC SARL",
    subtitle: "Client actif · Casablanca",
    icon: "Building2",
    color: "purple",
    lastOpened: "2026-06-29T09:02:00.000Z",
    openCount: 8,
    pinned: true
  },
  {
    id: "recent-finance-dashboard",
    targetId: "finance-dashboard",
    targetType: "dashboard",
    moduleId: "dashboard",
    title: "Finance Dashboard",
    subtitle: "Cash flow, marge et paiements",
    icon: "BarChart3",
    color: "green",
    lastOpened: "2026-06-28T16:50:00.000Z",
    openCount: 7,
    favorite: true
  },
  {
    id: "recent-search-clients",
    targetId: "search-clients",
    targetType: "search",
    moduleId: "clients",
    title: "Search Clients",
    subtitle: "Recherche : clients actifs",
    icon: "Search",
    color: "blue",
    lastOpened: "2026-06-28T11:35:00.000Z",
    openCount: 5,
    metadata: { query: "clients actifs" }
  },
  {
    id: "recent-notification-center",
    targetId: "notification-center",
    targetType: "widget",
    moduleId: "dashboard",
    title: "Notification Center",
    subtitle: "Alertes système et métier",
    icon: "Bell",
    color: "red",
    lastOpened: "2026-06-28T10:25:00.000Z",
    openCount: 3
  },
  {
    id: "recent-stock-report",
    targetId: "stock-report",
    targetType: "report",
    moduleId: "reports",
    title: "Stock Report",
    subtitle: "État du stock et produits critiques",
    icon: "Boxes",
    color: "orange",
    lastOpened: "2026-06-27T18:20:00.000Z",
    openCount: 4
  },
  {
    id: "recent-contract-renewal",
    targetId: "contract-renewal",
    targetType: "contract",
    moduleId: "contracts",
    title: "Contract Renewal",
    subtitle: "Renouvellement contrat employé",
    icon: "ScrollText",
    color: "green",
    lastOpened: "2026-06-27T16:00:00.000Z",
    openCount: 2
  },
  {
    id: "recent-executive-workspace",
    targetId: "executive-workspace",
    targetType: "widget",
    moduleId: "dashboard",
    title: "Executive Workspace",
    subtitle: "Activité, tâches et agenda",
    icon: "LayoutDashboard",
    color: "blue",
    lastOpened: "2026-06-27T09:45:00.000Z",
    openCount: 6,
    favorite: true
  },
  {
    id: "recent-payment-tracking",
    targetId: "payment-tracking",
    targetType: "payment",
    moduleId: "payments",
    title: "Payment Tracking",
    subtitle: "Suivi paiements clients",
    icon: "WalletCards",
    color: "green",
    lastOpened: "2026-06-27T08:35:00.000Z",
    openCount: 3
  },
  {
    id: "recent-document-bl-2026-45",
    targetId: "bl-2026-45",
    targetType: "document",
    moduleId: "delivery_notes",
    title: "Document BL-2026-45",
    subtitle: "Bon de livraison · Entreprise Atlas",
    icon: "Truck",
    color: "blue",
    lastOpened: "2026-06-26T17:15:00.000Z",
    openCount: 2
  },
  {
    id: "recent-pdf-invoice-template",
    targetId: "pdf-invoice-template",
    targetType: "document",
    moduleId: "pdf",
    title: "PDF Invoice Template",
    subtitle: "Modèle facture premium",
    icon: "FileOutput",
    color: "blue",
    lastOpened: "2026-06-26T15:10:00.000Z",
    openCount: 2
  },
  {
    id: "recent-settings-numbering",
    targetId: "settings-numbering",
    targetType: "module",
    moduleId: "settings",
    title: "Settings Numbering",
    subtitle: "Préfixes et numérotation",
    icon: "Settings",
    color: "slate",
    lastOpened: "2026-06-26T11:55:00.000Z",
    openCount: 1
  },
  {
    id: "recent-cash-module",
    targetId: "cash-module",
    targetType: "module",
    moduleId: "cash",
    title: "Cash Module",
    subtitle: "Caisse et mouvements",
    icon: "CircleDollarSign",
    color: "green",
    lastOpened: "2026-06-26T10:30:00.000Z",
    openCount: 4
  }
];

demoRecentItems.forEach(registerRecent);
