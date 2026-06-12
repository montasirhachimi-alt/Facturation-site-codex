"use client";

import { Download, Printer } from "lucide-react";
import { HicotechLogo } from "@/components/hicotech-logo";
import { createSalesPdf } from "@/lib/pdf";
import { formatCurrency } from "@/lib/format";
import type { SalesDocument } from "@/lib/types";

export function PdfPreview({ document }: { document: SalesDocument }) {
  const subtotal = document.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const vat = subtotal * 0.2;
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
          onClick={() => createSalesPdf(document)}
          className="inline-flex items-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2 text-sm font-bold text-white shadow-soft"
        >
          <Download size={18} />
          Télécharger PDF
        </button>
      </div>
      <article className="mx-auto max-w-4xl rounded-lg bg-white p-8 text-hicotech-ink shadow-soft print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <HicotechLogo size="md" />
            <div className="mt-8 text-sm leading-6">
              <p className="font-bold">HICOTECH</p>
              <p>123, Avenue Mohamed V</p>
              <p>Casablanca - Maroc</p>
              <p>ICE : 001234567000089</p>
              <p>IF : 12345678 - RC : 123456</p>
              <p>Tél : 0522 12 34 56</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="font-display text-3xl font-bold text-hicotech-navy">{document.type}</h2>
            <p className="mt-2 text-sm font-semibold">N° : {document.number}</p>
            <p className="text-sm">Date : {document.date}</p>
            <div className="mt-6 rounded-lg border border-slate-200 p-4 text-left text-sm leading-6">
              <p className="font-bold">Client</p>
              <p>{document.customer.name}</p>
              <p>{document.customer.address}</p>
              <p>{document.customer.city}</p>
              <p>ICE : {document.customer.ice}</p>
              <p>Tél : {document.customer.phone}</p>
            </div>
          </div>
        </header>
        <table className="mt-8 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-hicotech-blue text-white">
              <th className="px-3 py-3 text-left">Désignation</th>
              <th className="px-3 py-3 text-right">Qté</th>
              <th className="px-3 py-3 text-right">PU HT</th>
              <th className="px-3 py-3 text-right">TVA</th>
              <th className="px-3 py-3 text-right">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {document.lines.map((line) => (
              <tr key={line.designation} className="border border-slate-200">
                <td className="px-3 py-3">{line.designation}</td>
                <td className="px-3 py-3 text-right">{line.quantity}</td>
                <td className="px-3 py-3 text-right">{formatCurrency(line.unitPrice)}</td>
                <td className="px-3 py-3 text-right">{line.vat}%</td>
                <td className="px-3 py-3 text-right">{formatCurrency(line.quantity * line.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_280px]">
          <div className="rounded-lg border border-slate-200 p-4 text-sm">
            <p className="font-bold">Montant en lettres</p>
            <p className="mt-2">{document.amountInWords}</p>
            <p className="mt-4 font-bold">Conditions de paiement</p>
            <p className="mt-2">Paiement par virement, chèque ou espèces selon accord commercial.</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Total HT</span><strong>{formatCurrency(subtotal)}</strong></div>
            <div className="flex justify-between"><span>TVA 20%</span><strong>{formatCurrency(vat)}</strong></div>
            <div className="flex justify-between rounded-lg bg-hicotech-navy px-4 py-3 text-white">
              <span>Total TTC</span><strong>{formatCurrency(total)}</strong>
            </div>
          </div>
        </div>
        <footer className="mt-10 grid grid-cols-2 gap-8 text-center text-sm font-bold text-hicotech-navy">
          <div className="rounded-lg border border-dashed border-slate-300 py-8">Signature</div>
          <div className="rounded-lg border border-dashed border-slate-300 py-8">Cachet</div>
        </footer>
      </article>
    </div>
  );
}
