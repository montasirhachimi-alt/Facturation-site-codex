"use client";

import Link from "next/link";
import type { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  Boxes,
  Building2,
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
  WalletCards
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-hicotech-navy px-4 py-5 text-white shadow-soft lg:flex">
      <div className="mb-6 rounded-lg bg-white/5 p-3">
        <HicotechLogo compact inverse />
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto pr-1">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100/70">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href as LinkProps<string>["href"]}
                    className={clsx(
                      "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition",
                      active
                        ? "bg-hicotech-blue text-white shadow-lg shadow-blue-950/20"
                        : "text-slate-200 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
