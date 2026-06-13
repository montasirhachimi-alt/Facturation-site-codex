"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { salesSeries } from "@/lib/demo-data";

export function SalesChart() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <div className="mb-4">
        <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">
          Évolution des ventes
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-300">6 derniers mois</p>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={salesSeries}>
            <CartesianGrid stroke="#1E3A66" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#E6F2FF" }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "#E6F2FF" }} />
            <Tooltip formatter={(value) => [`${value} DH`, "Ventes"]} />
            <Line type="monotone" dataKey="sales" stroke="#0D6EFD" strokeWidth={3} dot={{ r: 5, fill: "#0D6EFD" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
