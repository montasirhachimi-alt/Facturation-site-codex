"use client";

import { Bell, CalendarDays, Command, LogOut, Menu, Moon, Search, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import type { AuthSession } from "@/lib/types";

type TopbarProps = {
  onMenuClick: () => void;
  user: AuthSession | null;
};

export function Topbar({ onMenuClick, user }: TopbarProps) {
  const [dark, setDark] = useState(false);
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
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    window.localStorage.setItem("hicotech-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 px-4 py-3 shadow-sm shadow-slate-200/30 backdrop-blur-xl dark:border-hicotech-dark-border dark:bg-hicotech-dark-sidebar/90 dark:shadow-none sm:px-6 lg:px-8">
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

        <div className="order-2 flex min-w-full flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm shadow-slate-200/60 transition focus-within:border-hicotech-blue focus-within:ring-4 focus-within:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none md:order-none md:min-w-72">
          <Search size={18} className="shrink-0 text-slate-400" />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-white"
            placeholder="Rechercher un client, facture, produit, document..."
          />
          <span className="hidden items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-400 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/70 lg:inline-flex">
            <Command size={12} />
            K
          </span>
        </div>

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
