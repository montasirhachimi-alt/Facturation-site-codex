import { registerFavorite } from "./favorites.registry";
import type { FavoriteInput } from "./favorites.types";

export const demoFavorites: FavoriteInput[] = [
  {
    id: "favorite-invoices",
    targetId: "invoices",
    targetType: "module",
    moduleId: "invoices",
    title: "Invoices",
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
    title: "Clients",
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
    id: "favorite-products",
    targetId: "products",
    targetType: "module",
    moduleId: "products",
    title: "Products",
    icon: "Boxes",
    color: "orange",
    order: 4,
    favoriteDate: "2026-06-29T08:45:00.000Z"
  },
  {
    id: "favorite-monthly-sales-report",
    targetId: "monthly-sales-report",
    targetType: "report",
    moduleId: "reports",
    title: "Monthly Sales Report",
    icon: "FileText",
    color: "blue",
    order: 5,
    favoriteDate: "2026-06-29T08:40:00.000Z"
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
    id: "favorite-stock",
    targetId: "stock",
    targetType: "module",
    moduleId: "products",
    title: "Stock",
    icon: "Package",
    color: "orange",
    order: 7,
    favoriteDate: "2026-06-29T08:30:00.000Z"
  },
  {
    id: "favorite-hr-dashboard",
    targetId: "hr-dashboard",
    targetType: "dashboard",
    moduleId: "employees",
    title: "HR Dashboard",
    icon: "ContactRound",
    color: "green",
    order: 8,
    favoriteDate: "2026-06-29T08:25:00.000Z"
  },
  {
    id: "favorite-purchases",
    targetId: "purchases",
    targetType: "module",
    moduleId: "purchases",
    title: "Purchases",
    icon: "HandCoins",
    color: "orange",
    order: 9,
    favoriteDate: "2026-06-29T08:20:00.000Z"
  },
  {
    id: "favorite-ai-assistant",
    targetId: "ai-assistant",
    targetType: "ai",
    moduleId: "ai_assistant",
    title: "AI Assistant",
    icon: "Bot",
    color: "purple",
    order: 10,
    pinned: true,
    favoriteDate: "2026-06-29T08:15:00.000Z"
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
    title: "Payments",
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
    title: "Search Clients",
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
