"use client";

import { Download, Printer } from "lucide-react";
import { createSalesPdf } from "@/lib/pdf";
import { formatCurrency } from "@/lib/format";
import { activeCompanyProfile } from "@/lib/demo-data";
import type { SalesDocument } from "@/lib/types";

export function PdfPreview({ document }: { document: SalesDocument }) {
  const company = activeCompanyProfile;
  const subtotal = document.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const vat = document.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * (line.vat / 100), 0);
  const total = subtotal + vat;

  return (
    <div className="space-y-4">
      <div className="no-print flex justify-end gap-2">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-hicotech-navy shadow-soft"
        >
          <Printer size={18} />
          Imprimer
        </button>
        <button
          onClick={() => createSalesPdf(document, activeCompanyProfile)}
          className="inline-flex items-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2 text-sm font-bold text-white shadow-soft"
        >
          <Download size={18} />
          Télécharger PDF
        </button>
      </div>

      <article className="mx-auto max-w-4xl rounded-lg bg-white p-8 text-hicotech-ink shadow-soft print:shadow-none">
        <header className="flex items-start justify-between gap-8 border-b border-slate-200 pb-6">
          <div>
            <div className="w-64 border border-sky-200 px-3 py-2">
              <p className="font-display text-4xl font-black tracking-tight text-black">
                <span className="text-sky-600">{company.name?.slice(0, 1) ?? "H"}</span>{company.name?.slice(1, -1) ?? "ICOTEC"}<span className="text-sky-200">{company.name?.slice(-1) ?? "H"}</span>
              </p>
              <div className="mt-1 h-2 bg-sky-600" />
            </div>
            <p className="mt-1 text-center text-xs font-bold tracking-wide">INFORMATIQUE SIMPLIFIÉE</p>
            <div className="mt-6 text-sm leading-6 text-slate-600">
              <p className="font-bold text-hicotech-navy">{company.name}</p>
              <p>{company.address}</p>
              <p>{company.city}</p>
              <p>Tél : {company.phone}</p>
              <p>ICE : {company.ice}</p>
              <p>IF : {company.taxId}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="font-display text-3xl font-bold text-hicotech-navy">{document.type}</h2>
            <div className="mt-3 text-sm leading-6 text-slate-600">
              <p><strong>N° :</strong> {document.number}</p>
              <p><strong>Date :</strong> {document.date}</p>
            </div>
            <div className="mt-6 rounded-lg border border-slate-200 bg-hicotech-sky/60 p-4 text-left text-sm leading-6">
              <p className="font-bold text-hicotech-blue">CLIENT</p>
              <p className="font-bold text-hicotech-navy">{document.customer.name}</p>
              <p>{document.customer.address}</p>
              <p>{document.customer.city}</p>
              <p>ICE : {document.customer.ice}</p>
              <p>Tél : {document.customer.phone}</p>
            </div>
          </div>
        </header>

        <table className="mt-8 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-hicotech-navy text-white">
              <th className="px-3 py-3 text-left">Désignation</th>
              <th className="px-3 py-3 text-left">Référence</th>
              <th className="px-3 py-3 text-right">Qté</th>
              <th className="px-3 py-3 text-right">PU HT</th>
              <th className="px-3 py-3 text-right">TVA</th>
              <th className="px-3 py-3 text-right">Total HT</th>
              <th className="px-3 py-3 text-right">Total TTC</th>
            </tr>
          </thead>
          <tbody>
            {document.lines.map((line, index) => {
              const lineHt = line.quantity * line.unitPrice;
              const lineTtc = lineHt * (1 + line.vat / 100);
              return (
                <tr key={`${line.designation}-${index}`} className="border-b border-slate-200 odd:bg-slate-50">
                  <td className="px-3 py-3">{line.designation}</td>
                  <td className="px-3 py-3 text-slate-500">REF-{String(index + 1).padStart(3, "0")}</td>
                  <td className="px-3 py-3 text-right">{line.quantity}</td>
                  <td className="px-3 py-3 text-right">{formatCurrency(line.unitPrice)}</td>
                  <td className="px-3 py-3 text-right">{line.vat}%</td>
                  <td className="px-3 py-3 text-right">{formatCurrency(lineHt)}</td>
                  <td className="px-3 py-3 text-right font-bold text-hicotech-navy">{formatCurrency(lineTtc)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_280px]">
          <div className="rounded-lg border border-slate-200 bg-hicotech-sky/60 p-4 text-sm">
            <p className="font-bold text-hicotech-navy">Montant en lettres</p>
            <p className="mt-2">{document.amountInWords}</p>
            <p className="mt-4 font-bold text-hicotech-navy">Conditions de paiement</p>
            <p className="mt-2">Paiement par virement, chèque ou espèces selon accord commercial.</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 text-sm">
            <div className="flex justify-between"><span>Total HT</span><strong>{formatCurrency(subtotal)}</strong></div>
            <div className="mt-2 flex justify-between"><span>Total TVA</span><strong>{formatCurrency(vat)}</strong></div>
            <div className="mt-2 flex justify-between"><span>Remise</span><strong>{formatCurrency(0)}</strong></div>
            <div className="mt-2 flex justify-between"><span>Montant payé</span><strong>{formatCurrency(0)}</strong></div>
            <div className="mt-2 flex justify-between"><span>Reste à payer</span><strong>{formatCurrency(total)}</strong></div>
            <div className="mt-4 flex justify-between rounded-lg bg-hicotech-blue px-4 py-3 text-white">
              <span>Total TTC</span><strong>{formatCurrency(total)}</strong>
            </div>
          </div>
        </div>

        <footer className="mt-10 grid grid-cols-2 gap-8 text-center text-sm font-bold text-hicotech-navy">
          <div className="rounded-lg border border-slate-200 py-8">Signature client</div>
          <div className="rounded-lg border border-slate-200 py-8">Cachet et signature</div>
        </footer>
        <div className="mt-8 flex justify-between border-t border-slate-200 pt-3 text-xs text-slate-500">
          <span>Tél : {company.phone} | ICE : {company.ice} | IF : {company.taxId}</span>
          <span>Page 1/1</span>
        </div>
      </article>
    </div>
  );
}
