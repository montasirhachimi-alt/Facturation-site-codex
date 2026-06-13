"use client";

import Link from "next/link";
import type { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  Boxes,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  CircleDollarSign,
  ClipboardList,
  FileOutput,
  FileText,
  HandCoins,
  LayoutDashboard,
  PackageCheck,
  Receipt,
  Settings,
  Truck,
  Users,
  WalletCards,
  X
} from "lucide-react";
import { clsx } from "clsx";
import { HicotechLogo } from "@/components/hicotech-logo";

const groups = [
  {
    label: "Pilotage",
    items: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/statistiques", label: "Statistiques", icon: BarChart3 },
      { href: "/paiements", label: "Suivi paiements", icon: WalletCards }
    ]
  },
  {
    label: "Ventes",
    items: [
      { href: "/ventes", label: "Documents", icon: FileText },
      { href: "/devis", label: "Devis", icon: ClipboardList },
      { href: "/factures", label: "Factures", icon: Receipt },
      { href: "/livraisons", label: "Bons de livraison", icon: Truck }
    ]
  },
  {
    label: "Gestion",
    items: [
      { href: "/stock", label: "Produits & stock", icon: Boxes },
      { href: "/achats", label: "Achats", icon: HandCoins },
      { href: "/caisse", label: "Caisse", icon: CircleDollarSign },
      { href: "/clients", label: "Clients", icon: Users },
      { href: "/fournisseurs", label: "Fournisseurs", icon: Building2 }
    ]
  },
  {
    label: "Outils",
    items: [
      { href: "/pdf", label: "Documents PDF", icon: FileOutput },
      { href: "/rapports", label: "Rapports", icon: PackageCheck },
      { href: "/assistant-ia", label: "Assistant IA", icon: Bot },
      { href: "/parametres", label: "Paramètres", icon: Settings }
    ]
  }
];

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
};

export function Sidebar({ collapsed, mobileOpen, onCloseMobile, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

  const renderContent = (isCollapsed: boolean) => (
    <>
      <div className={clsx("mb-6 rounded-lg bg-white/5 dark:bg-hicotech-dark-card", isCollapsed ? "p-2" : "p-4")}>
        <HicotechLogo compact inverse markOnly={isCollapsed} />
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto pr-1">
        {groups.map((group) => (
          <div key={group.label}>
            {!isCollapsed && (
              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100/70">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href as LinkProps<string>["href"]}
                    onClick={onCloseMobile}
                    title={isCollapsed ? item.label : undefined}
                    className={clsx(
                      "flex h-11 items-center rounded-lg text-sm font-semibold transition",
                      isCollapsed ? "justify-center px-0" : "gap-3 px-3",
                      active
                        ? "bg-hicotech-blue text-white shadow-lg shadow-blue-950/20"
                        : "text-slate-200 hover:bg-white/10 hover:text-white dark:text-slate-100 dark:hover:bg-hicotech-dark-card"
                    )}
                  >
                    <Icon size={19} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <button
        type="button"
        onClick={onToggleCollapse}
        className="mt-4 hidden h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 text-sm font-semibold text-white transition hover:bg-hicotech-blue lg:flex"
        aria-label={collapsed ? "Agrandir la sidebar" : "Réduire la sidebar"}
      >
        {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        {!collapsed && <span>Réduire</span>}
      </button>
    </>
  );

  return (
    <>
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 hidden flex-col bg-hicotech-navy px-4 py-5 text-white shadow-soft transition-[width] duration-300 dark:bg-hicotech-dark-sidebar lg:flex",
          collapsed ? "w-24" : "w-80"
        )}
      >
        {renderContent(collapsed)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-hicotech-dark-sidebar/70 backdrop-blur-sm"
            aria-label="Fermer le menu"
            onClick={onCloseMobile}
          />
          <aside className="relative flex h-full w-[min(22rem,calc(100vw-2rem))] flex-col bg-hicotech-dark-sidebar px-4 py-5 text-white shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-sm font-bold uppercase tracking-[0.18em] text-cyan-100/70">
                Menu
              </span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="rounded-lg border border-white/10 bg-hicotech-dark-card p-2 text-white"
                aria-label="Fermer le menu"
              >
                <X size={18} />
              </button>
            </div>
            {renderContent(false)}
          </aside>
        </div>
      )}
    </>
  );
}
