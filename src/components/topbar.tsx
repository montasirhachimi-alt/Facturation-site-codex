"use client";

import { Bell, Building2, CalendarDays, Check, ChevronDown, Command, LogOut, Menu, Moon, Search, Settings, Sparkles, Sun, Wrench } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { useUniversalSearch } from "@/platform/search";
import type { AuthSession } from "@/lib/types";

type TopbarProps = {
  onMenuClick: () => void;
  user: AuthSession | null;
};

export function Topbar({ onMenuClick, user }: TopbarProps) {
  const [dark, setDark] = useState(false);
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl+K");
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const workspaceMenuRef = useRef<HTMLDivElement | null>(null);
  const { openSearch } = useUniversalSearch();
  const today = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date());
  const userInitials =
    user?.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "AD";

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("hicotech-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(storedTheme ? storedTheme === "dark" : prefersDark);
    setShortcutLabel(isMacPlatform() ? "⌘K" : "Ctrl+K");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    window.localStorage.setItem("hicotech-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    if (!workspaceOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!workspaceMenuRef.current?.contains(event.target as Node)) {
        setWorkspaceOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setWorkspaceOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [workspaceOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm shadow-slate-200/30 backdrop-blur-xl dark:border-hicotech-dark-border dark:bg-hicotech-dark-sidebar/90 dark:shadow-none sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg border border-slate-200 p-2 text-hicotech-navy lg:hidden dark:border-hicotech-dark-border dark:text-white"
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} />
        </button>
        <div className="w-40 max-w-[45vw] lg:hidden">
          <Logo size="sm" />
        </div>

        <div ref={workspaceMenuRef} className="relative hidden xl:block">
          <button
            type="button"
            onClick={() => setWorkspaceOpen((value) => !value)}
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm shadow-slate-200/50 transition hover:border-hicotech-blue/40 hover:bg-hicotech-sky/60 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none dark:hover:bg-hicotech-blue/15"
            aria-expanded={workspaceOpen}
            aria-haspopup="menu"
            aria-label="Ouvrir le sélecteur d'espace de travail"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/20 dark:text-white">
              <Building2 size={18} />
            </span>
            <span className="leading-tight">
              <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Espace de travail</span>
              <span className="block text-sm font-bold text-hicotech-navy dark:text-white">HicoPilot CRM</span>
            </span>
            <ChevronDown size={15} className={`text-slate-400 transition ${workspaceOpen ? "rotate-180" : ""}`} />
          </button>

          {workspaceOpen && <WorkspaceSelectorMenu onClose={() => setWorkspaceOpen(false)} />}
        </div>

        <button
          type="button"
          onClick={openSearch}
          className="order-2 flex min-w-full flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm shadow-slate-200/60 transition hover:border-hicotech-blue/30 hover:bg-hicotech-sky/40 focus:outline-none focus:ring-2 focus:ring-hicotech-blue/40 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none dark:hover:bg-hicotech-blue/15 md:order-none md:min-w-72"
          aria-label="Ouvrir la recherche globale"
        >
          <Search size={18} className="shrink-0 text-slate-400" />
          <span className="min-w-0 flex-1 text-sm font-medium text-slate-400">Rechercher...</span>
          <span className="hidden items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-400 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/70 lg:inline-flex">
            {shortcutLabel === "⌘K" && <Command size={12} />}
            {shortcutLabel}
          </span>
        </button>

        <button className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-hicotech-navy shadow-sm shadow-slate-200/50 transition hover:border-hicotech-blue/40 hover:bg-hicotech-sky/60 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-white dark:shadow-none dark:hover:bg-hicotech-blue/15 lg:flex">
          <Sparkles size={17} className="text-hicotech-blue" />
          Commande
        </button>

        <button className="ml-auto hidden items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-hicotech-navy shadow-sm shadow-slate-200/50 transition hover:border-hicotech-blue/40 hover:bg-hicotech-sky/60 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-white dark:shadow-none dark:hover:bg-hicotech-blue/15 md:flex">
          <span className="grid size-9 place-items-center rounded-lg bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/20 dark:text-white">
            <CalendarDays size={18} />
          </span>
          <span className="leading-tight">
            <span className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Aujourd&apos;hui</span>
            <span className="block text-sm font-bold capitalize">{today}</span>
          </span>
        </button>

        <button
          className="grid size-11 place-items-center rounded-lg border border-slate-200 bg-white text-hicotech-navy shadow-sm shadow-slate-200/50 transition hover:border-hicotech-blue/40 hover:bg-hicotech-sky/60 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-white dark:shadow-none dark:hover:bg-hicotech-blue/15"
          onClick={() => setDark((value) => !value)}
          aria-label="Changer le thème"
        >
          {dark ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        <button className="relative grid size-11 place-items-center rounded-lg border border-slate-200 bg-white text-hicotech-navy shadow-sm shadow-slate-200/50 transition hover:border-hicotech-blue/40 hover:bg-hicotech-sky/60 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-white dark:shadow-none dark:hover:bg-hicotech-blue/15" aria-label="Notifications">
          <Bell size={19} />
          <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-hicotech-red ring-2 ring-white dark:ring-hicotech-dark-card" />
        </button>

        <form action="/logout" method="post" className="hidden sm:block">
          <button
            type="submit"
            className="grid size-11 place-items-center rounded-lg border border-slate-200 bg-white text-hicotech-navy shadow-sm shadow-slate-200/50 transition hover:border-hicotech-blue/40 hover:bg-hicotech-sky/60 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-white dark:shadow-none dark:hover:bg-hicotech-blue/15"
            aria-label="Se déconnecter"
          >
            <LogOut size={17} />
          </button>
        </form>
        <form action="/logout" method="post" className="sm:hidden">
          <button
            type="submit"
            className="grid size-11 place-items-center rounded-lg border border-slate-200 bg-white text-hicotech-navy transition hover:bg-hicotech-sky dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-white dark:hover:bg-hicotech-blue/20"
            aria-label="Se déconnecter"
          >
            <LogOut size={19} />
          </button>
        </form>

        <div className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-1.5 shadow-sm shadow-slate-200/50 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
          <span className="hidden min-w-0 text-right leading-tight sm:block">
            <span className="block max-w-36 truncate text-sm font-bold text-hicotech-navy dark:text-white">
              {user?.name ?? "Administrateur"}
            </span>
            <span className="block text-xs font-semibold text-slate-400">
              {getRoleLabel(user?.role)}
            </span>
          </span>
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-hicotech-navy font-display text-sm font-bold text-white dark:bg-hicotech-blue">
            {userInitials}
          </span>
        </div>
      </div>
    </header>
  );
}

function WorkspaceSelectorMenu({ onClose }: { onClose: () => void }) {
  const workspaces = [
    { name: "HicoPilot CRM", active: true, available: true },
    { name: "HicoPilot Ventes", active: false, available: false },
    { name: "HicoPilot Finance", active: false, available: false }
  ];

  return (
    <div
      role="menu"
      aria-label="Sélecteur de workspace"
      className="absolute left-0 top-full z-50 mt-3 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/70 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-black/30"
    >
      <div className="px-3 py-2">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Espace de travail actuel</p>
        <p className="mt-1 text-sm font-bold text-hicotech-navy dark:text-white">HicoPilot CRM</p>
      </div>

      <div className="my-2 h-px bg-slate-100 dark:bg-hicotech-dark-border" />

      <div className="space-y-1">
        {workspaces.map((workspace) => (
          <button
            key={workspace.name}
            type="button"
            role="menuitem"
            disabled={!workspace.available}
            onClick={() => {
              if (workspace.available) onClose();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-hicotech-cloud focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 disabled:cursor-not-allowed disabled:opacity-70 dark:hover:bg-hicotech-dark-page"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/20 dark:text-white">
              <Building2 size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-hicotech-navy dark:text-white">{workspace.name}</span>
              <span className="block text-xs font-semibold text-slate-400">
                {workspace.active ? "Actif" : "Bientôt disponible"}
              </span>
            </span>
            {workspace.active && <Check size={17} className="text-hicotech-blue" />}
          </button>
        ))}
      </div>

      <div className="my-2 h-px bg-slate-100 dark:bg-hicotech-dark-border" />

      <div className="space-y-1">
        <WorkspaceMenuAction icon={<Settings size={16} />} label="Paramètres de l'espace" onClick={onClose} />
        <WorkspaceMenuAction icon={<Wrench size={16} />} label="Gérer les espaces" onClick={onClose} />
      </div>
    </div>
  );
}

function WorkspaceMenuAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-bold text-slate-600 transition hover:bg-hicotech-cloud focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:text-slate-200 dark:hover:bg-hicotech-dark-page"
    >
      <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-200">
        {icon}
      </span>
      {label}
    </button>
  );
}

function getRoleLabel(role: AuthSession["role"] | undefined) {
  const labels: Record<AuthSession["role"], string> = {
    SUPER_ADMIN: "Super admin",
    COMPANY_ADMIN: "Administrateur",
    SALES: "Ventes",
    STOCK_MANAGER: "Gestion stock",
    ACCOUNTANT: "Comptabilité",
    HR: "Ressources humaines",
    WAREHOUSE: "Entrepôt",
    READ_ONLY: "Lecture seule"
  };

  return role ? labels[role] : "Administrateur";
}

function isMacPlatform() {
  const platform = navigator.platform.toLowerCase();
  const userAgent = navigator.userAgent.toLowerCase();
  return platform.includes("mac") || userAgent.includes("mac os");
}
