import { registerFavorite } from "./favorites.registry";
import type { FavoriteInput } from "./favorites.types";

export const demoFavorites: FavoriteInput[] = [
  {
    id: "favorite-invoices",
    targetId: "invoices",
    targetType: "module",
    moduleId: "invoices",
    title: "Factures",
    icon: "Receipt",
    color: "blue",
    order: 1,
    pinned: true,
    favoriteDate: "2026-06-29T09:00:00.000Z"
  },
  {
    id: "favorite-clients",
    targetId: "clients",
    targetType: "module",
    moduleId: "clients",
    title: "Sociétés",
    icon: "Users",
    color: "purple",
    order: 2,
    favoriteDate: "2026-06-29T08:55:00.000Z"
  },
  {
    id: "favorite-dashboard-finance",
    targetId: "dashboard-finance",
    targetType: "dashboard",
    moduleId: "dashboard",
    title: "Dashboard Finance",
    icon: "BarChart3",
    color: "green",
    order: 3,
    favoriteDate: "2026-06-29T08:50:00.000Z"
  },
  {
    id: "favorite-abc-sarl",
    targetId: "client-abc-sarl",
    targetType: "client",
    moduleId: "clients",
    title: "ABC SARL",
    icon: "Building2",
    color: "purple",
    order: 6,
    favoriteDate: "2026-06-29T08:35:00.000Z",
    metadata: { ice: "003390979000024" }
  },
  {
    id: "favorite-executive-workspace",
    targetId: "executive-workspace",
    targetType: "widget",
    moduleId: "dashboard",
    title: "Executive Workspace",
    icon: "LayoutDashboard",
    color: "blue",
    order: 11,
    favoriteDate: "2026-06-29T08:10:00.000Z"
  },
  {
    id: "favorite-payments",
    targetId: "payments",
    targetType: "module",
    moduleId: "payments",
    title: "Paiements",
    icon: "WalletCards",
    color: "green",
    order: 12,
    favoriteDate: "2026-06-29T08:05:00.000Z"
  },
  {
    id: "favorite-search-clients",
    targetId: "search-clients",
    targetType: "search",
    moduleId: "clients",
    title: "Recherche sociétés",
    icon: "Search",
    color: "blue",
    order: 13,
    favoriteDate: "2026-06-29T08:00:00.000Z",
    metadata: { query: "clients actifs" }
  },
  {
    id: "favorite-notifications",
    targetId: "notifications",
    targetType: "command",
    moduleId: "dashboard",
    title: "Notifications",
    icon: "Bell",
    color: "red",
    order: 14,
    favoriteDate: "2026-06-29T07:55:00.000Z"
  },
  {
    id: "favorite-audit-logs",
    targetId: "audit-logs",
    targetType: "report",
    moduleId: "users",
    title: "Audit Logs",
    icon: "ShieldCheck",
    color: "red",
    order: 15,
    favoriteDate: "2026-06-29T07:50:00.000Z"
  }
];

demoFavorites.forEach(registerFavorite);
