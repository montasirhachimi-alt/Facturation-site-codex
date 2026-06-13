"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { salesSeries, topClients } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/format";

const chartText = "#8EA8CC";

export function SalesEvolutionChart() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">
            Évolution des ventes
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">Chiffre d&apos;affaires sur 6 mois</p>
        </div>
        <span className="rounded-md bg-hicotech-sky px-2 py-1 text-xs font-bold text-hicotech-blue">
          +18,4% vs période précédente
        </span>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={salesSeries}>
            <defs>
              <linearGradient id="salesFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#0D6EFD" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0D6EFD" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1E3A66" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: chartText }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: chartText }} />
            <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Ventes"]} />
            <Area type="monotone" dataKey="sales" stroke="#0D6EFD" strokeWidth={3} fill="url(#salesFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function FinanceBarsChart() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <div className="mb-4">
        <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">
          Ventes, achats et dépenses
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-300">Comparatif mensuel</p>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={salesSeries}>
            <CartesianGrid stroke="#1E3A66" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: chartText }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: chartText }} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Bar dataKey="sales" name="Ventes" fill="#0D6EFD" radius={[6, 6, 0, 0]} />
            <Bar dataKey="purchases" name="Achats" fill="#FF8C00" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expenses" name="Dépenses" fill="#E74C3C" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function MarginDonutChart() {
  const data = [
    { name: "Marge brute", value: 77130, color: "#2ECC71" },
    { name: "Achats", value: 48300, color: "#FF8C00" },
    { name: "Dépenses", value: 18450, color: "#E74C3C" }
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <div className="mb-4">
        <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">
          Répartition financière
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-300">Marge, achats et dépenses</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={58} outerRadius={90} paddingAngle={4}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <strong className="text-hicotech-navy dark:text-white">{formatCurrency(item.value)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TopClientsPanel() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <div className="mb-4">
        <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">
          Top clients
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-300">Classement par total vendu</p>
      </div>
      <div className="space-y-3">
        {topClients.map((client, index) => {
          const ratio = Math.min(100, (client.total / topClients[0].total) * 100);

          return (
            <div key={client.company} className="rounded-lg border border-slate-100 p-3 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-bold text-hicotech-navy dark:text-white">
                  {index + 1}. {client.company}
                </span>
                <span className="font-bold text-hicotech-blue">{formatCurrency(client.total)}</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-hicotech-sky dark:bg-hicotech-dark-sidebar">
                <div className="h-2 rounded-full bg-hicotech-blue" style={{ width: `${ratio}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">
                Encaissé : {formatCurrency(client.paid)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
