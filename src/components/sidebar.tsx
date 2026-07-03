"use client";

import Link from "next/link";
import type { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  Boxes,
  Building2,
  CalendarCheck,
  CalendarX,
  ChevronsLeft,
  ChevronsRight,
  Clock3,
  CircleDollarSign,
  ClipboardList,
  Pin,
  Star,
  ContactRound,
  FileArchive,
  FileOutput,
  FileText,
  HandCoins,
  LayoutDashboard,
  Landmark,
  PackageCheck,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  Truck,
  UserCog,
  Users,
  WalletCards,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";
import { Logo } from "@/components/logo";
import { branding } from "@/lib/branding";
import { canViewModule } from "@/lib/rbac";
import type { AuthSession, PermissionModule } from "@/lib/types";
import { getSidebarGroups } from "@/services/navigation";

const sidebarIconMap: Record<string, LucideIcon> = {
  BarChart3,
  Bot,
  Boxes,
  Building2,
  CalendarCheck,
  CalendarX,
  CircleDollarSign,
  ClipboardList,
  ContactRound,
  FileArchive,
  FileOutput,
  FileText,
  HandCoins,
  Landmark,
  LayoutDashboard,
  PackageCheck,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  Truck,
  UserCog,
  Users,
  WalletCards
};

const groups = getSidebarGroups();

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
  user: AuthSession | null;
};

export function Sidebar({ collapsed, mobileOpen, onCloseMobile, onToggleCollapse, user }: SidebarProps) {
  const pathname = usePathname();
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => user && canViewModule(user.role, item.module as PermissionModule))
    }))
    .filter((group) => group.items.length > 0);

  const renderContent = (isCollapsed: boolean) => (
    <>
      <div className={clsx("mb-6 rounded-lg bg-white/5 dark:bg-hicotech-dark-card", isCollapsed ? "p-2" : "p-4")}>
        <Logo variant={isCollapsed ? "icon" : "full"} tone="dark" size={isCollapsed ? "sm" : "md"} className="mx-auto" />
        {!isCollapsed && (
          <>
            <p className="mt-4 text-center font-display text-sm font-bold text-white">
              {branding.productName}
            </p>
            <p className="mt-1 text-center text-[11px] font-semibold text-cyan-100/55">Business Operating System</p>
          </>
        )}
      </div>
      {!isCollapsed && (
        <div className="mb-5 grid grid-cols-3 gap-2">
          <SidebarPlaceholder icon={Star} label="Favoris" />
          <SidebarPlaceholder icon={Pin} label="Épinglés" />
          <SidebarPlaceholder icon={Clock3} label="Récents" />
        </div>
      )}
      <nav className="flex-1 space-y-7 overflow-y-auto pr-1">
        {visibleGroups.map((group) => (
          <div key={group.label} className="space-y-2">
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-100/60">
                {group.label}
              </p>
            )}
            <div className={clsx("space-y-1", isCollapsed && "border-t border-white/10 pt-3 first:border-t-0 first:pt-0")}>
              {group.items.map((item) => {
                const Icon = sidebarIconMap[item.icon] ?? FileText;
                const active = item.activePaths
                  ? item.activePaths.some((path) => pathname === path || (path !== "/crm" && pathname.startsWith(`${path}/`)))
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.id}
                    href={item.href as LinkProps<string>["href"]}
                    onClick={onCloseMobile}
                    title={isCollapsed ? item.label : undefined}
                    className={clsx(
                      "flex h-11 items-center rounded-lg text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-hicotech-blue/60",
                      isCollapsed ? "justify-center px-0" : "gap-3 px-3",
                      active
                        ? "bg-hicotech-blue text-white shadow-lg shadow-blue-950/20"
                        : "text-slate-300 hover:bg-white/10 hover:text-white dark:text-slate-100 dark:hover:bg-hicotech-dark-card"
                    )}
                  >
                    <Icon size={19} />
                    {!isCollapsed && (
                      <>
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-cyan-100/70">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
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

function SidebarPlaceholder({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[11px] font-bold text-cyan-100/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-hicotech-blue/60"
      aria-label={`${label} bientôt disponible`}
      title={`${label} bientôt disponible`}
    >
      <Icon size={15} className="mx-auto mb-1" />
      {label}
    </button>
  );
}
