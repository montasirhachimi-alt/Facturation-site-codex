"use client";

import { Bell, CalendarDays, LogOut, Menu, Moon, Search, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import type { AuthSession } from "@/lib/types";

type TopbarProps = {
  onMenuClick: () => void;
  user: AuthSession | null;
};

export function Topbar({ onMenuClick, user }: TopbarProps) {
  const [dark, setDark] = useState(false);

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
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-hicotech-dark-border dark:bg-hicotech-dark-sidebar/95 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
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
        <div className="hidden flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-hicotech-cloud px-3 py-2 md:flex dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
          <Search size={18} className="text-slate-400" />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-white"
            placeholder="Rechercher client, facture, produit..."
          />
        </div>
        <button className="ml-auto hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-hicotech-navy md:flex dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-white">
          <CalendarDays size={17} />
          Aujourd&apos;hui
        </button>
        <button
          className="rounded-lg border border-slate-200 p-2 text-hicotech-navy dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-white"
          onClick={() => setDark((value) => !value)}
          aria-label="Changer le thème"
        >
          {dark ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <button className="rounded-lg border border-slate-200 p-2 text-hicotech-navy dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-white" aria-label="Notifications">
          <Bell size={19} />
        </button>
        <form action="/logout" method="post" className="hidden sm:block">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-hicotech-navy transition hover:bg-hicotech-sky dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-white dark:hover:bg-hicotech-blue/20"
          >
            <LogOut size={17} />
            Se déconnecter
          </button>
        </form>
        <form action="/logout" method="post" className="sm:hidden">
          <button
            type="submit"
            className="rounded-lg border border-slate-200 p-2 text-hicotech-navy transition hover:bg-hicotech-sky dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-white dark:hover:bg-hicotech-blue/20"
            aria-label="Se déconnecter"
          >
            <LogOut size={19} />
          </button>
        </form>
        <div className="grid size-10 place-items-center rounded-full bg-hicotech-navy font-display text-sm font-bold text-white">
          {user?.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() ?? "AD"}
        </div>
      </div>
    </header>
  );
}
