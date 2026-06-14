import type { PermissionAction, PermissionModule, Role } from "@/lib/types";

export const allPermissionModules: PermissionModule[] = [
  "dashboard",
  "quotes",
  "invoices",
  "delivery_notes",
  "purchases",
  "stock",
  "clients",
  "suppliers",
  "cash",
  "expenses",
  "payments",
  "reports",
  "pdf_documents",
  "hr",
  "settings",
  "users",
  "assistant"
];

const allActions: PermissionAction[] = ["view", "create", "edit", "delete", "export", "print", "approve"];
const viewOnly: PermissionAction[] = ["view", "export", "print"];

const fullAccess = Object.fromEntries(allPermissionModules.map((module) => [module, allActions])) as Record<PermissionModule, PermissionAction[]>;

export const rolePermissions: Record<Role, Partial<Record<PermissionModule, PermissionAction[]>>> = {
  SUPER_ADMIN: fullAccess,
  COMPANY_ADMIN: fullAccess,
  SALES: {
    dashboard: ["view"],
    quotes: allActions,
    invoices: allActions,
    delivery_notes: allActions,
    clients: allActions,
    stock: ["view"],
    payments: ["view", "create", "export", "print"]
  },
  STOCK_MANAGER: {
    dashboard: ["view"],
    stock: allActions,
    purchases: allActions,
    suppliers: allActions,
    delivery_notes: allActions
  },
  WAREHOUSE: {
    dashboard: ["view"],
    stock: allActions,
    purchases: ["view", "create", "edit", "export", "print"],
    suppliers: ["view"],
    delivery_notes: allActions
  },
  ACCOUNTANT: {
    dashboard: ["view"],
    cash: allActions,
    expenses: allActions,
    payments: allActions,
    reports: ["view", "export", "print"],
    invoices: viewOnly,
    purchases: viewOnly,
    pdf_documents: viewOnly
  },
  HR: {
    dashboard: ["view"],
    hr: allActions
  },
  READ_ONLY: Object.fromEntries(allPermissionModules.map((module) => [module, ["view"]])) as Partial<Record<PermissionModule, PermissionAction[]>>
};

export function can(role: Role, module: PermissionModule, action: PermissionAction = "view") {
  return rolePermissions[role][module]?.includes(action) ?? false;
}

export function canViewModule(role: Role, module: PermissionModule) {
  return can(role, module, "view");
}

export function getModuleForPath(pathname: string): PermissionModule | null {
  if (pathname === "/dashboard" || pathname === "/") return "dashboard";
  if (pathname.startsWith("/devis")) return "quotes";
  if (pathname.startsWith("/factures")) return "invoices";
  if (pathname.startsWith("/livraisons")) return "delivery_notes";
  if (pathname.startsWith("/achats")) return "purchases";
  if (pathname.startsWith("/stock")) return "stock";
  if (pathname.startsWith("/clients")) return "clients";
  if (pathname.startsWith("/fournisseurs")) return "suppliers";
  if (pathname.startsWith("/caisse")) return "cash";
  if (pathname.startsWith("/depenses")) return "expenses";
  if (pathname.startsWith("/paiements")) return "payments";
  if (pathname.startsWith("/rapports") || pathname.startsWith("/statistiques")) return "reports";
  if (pathname.startsWith("/pdf")) return "pdf_documents";
  if (pathname.startsWith("/rh")) return "hr";
  if (pathname.startsWith("/parametres")) return "settings";
  if (pathname.startsWith("/utilisateurs")) return "users";
  if (pathname.startsWith("/assistant-ia")) return "assistant";
  if (pathname.startsWith("/ventes")) return "quotes";
  return null;
}
