import type { PdfLayoutDocument } from "@/components/pdf-templates/PdfLayout";
import { calculatePdfPreviewTotals, formatPdfMoney } from "./sales-document-pdf.utils";

export function SalesDocumentTemplate({ document }: { document: PdfLayoutDocument }) {
  const totals = calculatePdfPreviewTotals(document);
  const currency = document.currency ?? "MAD";

  return (
    <article className="mx-auto w-full max-w-[860px] rounded-2xl border border-slate-200 bg-white p-5 text-hicotech-navy shadow-xl shadow-slate-900/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-white sm:p-7">
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between dark:border-hicotech-dark-border">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-hicotech-blue">{document.company?.name ?? "BOSIACO"}</p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-normal text-hicotech-navy dark:text-white">{document.title}</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-300">{document.number}</p>
        </div>
        <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-hicotech-dark-border dark:bg-slate-900/30">
          <PreviewMeta label="Date" value={document.date} />
          {document.dueDate ? <PreviewMeta label="Échéance" value={document.dueDate} /> : null}
          {document.status ? <PreviewMeta label="Statut" value={document.status} /> : null}
          {document.internalReference ? <PreviewMeta label="Référence" value={document.internalReference} /> : null}
        </div>
      </header>

      <section className="grid gap-4 py-5 md:grid-cols-2">
        <PartyBlock
          title="Émetteur"
          rows={[
            { id: "issuer.name", value: document.company?.name },
            { id: "issuer.address", value: document.company?.address },
            { id: "issuer.city", value: document.company?.city },
            { id: "issuer.ice", value: document.company?.ice ? `ICE ${document.company.ice}` : undefined },
            { id: "issuer.phone", value: document.company?.phone },
            { id: "issuer.email", value: document.company?.email }
          ]}
        />
        <PartyBlock
          title={document.recipient.label}
          rows={[
            { id: "recipient.name", value: document.recipient.name },
            { id: "recipient.company", value: document.recipient.company },
            { id: "recipient.address", value: document.recipient.address },
            { id: "recipient.city", value: document.recipient.city },
            { id: "recipient.ice", value: document.recipient.ice ? `ICE ${document.recipient.ice}` : undefined },
            { id: "recipient.phone", value: document.recipient.phone },
            { id: "recipient.email", value: document.recipient.email }
          ]}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 dark:border-hicotech-dark-border">
        <div className="overflow-x-auto">
          <table className={`w-full text-sm ${document.hideFinancials ? "min-w-[480px]" : "min-w-[700px]"}`}>
            <thead className="bg-hicotech-navy text-left text-white">
              <tr>
                <th className="px-4 py-3 font-bold">Référence</th>
                <th className="px-4 py-3 font-bold">Désignation</th>
                <th className="px-4 py-3 text-right font-bold">Qté</th>
                {!document.hideFinancials ? <th className="px-4 py-3 text-right font-bold">PU</th> : null}
                {!document.hideFinancials ? <th className="px-4 py-3 text-right font-bold">TVA</th> : null}
                {!document.hideFinancials ? <th className="px-4 py-3 text-right font-bold">Total</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-hicotech-dark-border">
              {document.lines.map((line, index) => (
                <tr key={`${line.reference}-${index}`} className="bg-white odd:bg-slate-50/70 dark:bg-hicotech-dark-card dark:odd:bg-slate-900/25">
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{line.reference}</td>
                  <td className="px-4 py-3 font-semibold">{line.designation}</td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{formatQuantity(line.quantity)}</td>
                  {!document.hideFinancials ? <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{formatPdfMoney(line.unitPrice, currency)}</td> : null}
                  {!document.hideFinancials ? <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{line.vat}%</td> : null}
                  {!document.hideFinancials ? <td className="px-4 py-3 text-right font-bold">{formatPdfMoney(line.quantity * line.unitPrice, currency)}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className={`grid gap-4 pt-5 ${document.hideFinancials ? "md:grid-cols-2" : "md:grid-cols-[1fr_300px]"}`}>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:border-hicotech-dark-border dark:bg-slate-900/30 dark:text-slate-300">
          <p className="font-bold text-hicotech-navy dark:text-white">{document.hideFinancials ? "Informations de livraison" : "Conditions"}</p>
          <p className="mt-1">{document.paymentTerms ?? "Conditions commerciales selon accord."}</p>
          {document.notes ? <p className="mt-3">{document.notes}</p> : null}
        </div>
        {document.hideFinancials ? <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card"><p className="font-bold text-hicotech-navy dark:text-white">Réception</p><p className="mt-2 text-slate-500">Nom, cachet et signature du destinataire</p><div className="mt-8 border-t border-dashed border-slate-300 pt-2 text-xs text-slate-400">Date et signature</div></div> : <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
          <PreviewTotal label="Sous-total" value={formatPdfMoney(totals.subtotal, currency)} />
          <PreviewTotal label="TVA" value={formatPdfMoney(totals.tax, currency)} />
          <PreviewTotal label="Remise" value={formatPdfMoney(totals.discount, currency)} />
          <PreviewTotal label="Total TTC" value={formatPdfMoney(totals.total, currency)} strong />
          {document.paidAmount !== undefined ? (
            <>
              <PreviewTotal label="Payé" value={formatPdfMoney(totals.paid, currency)} />
              <PreviewTotal label="Reste à payer" value={formatPdfMoney(totals.remaining, currency)} strong />
            </>
          ) : null}
        </div>}
      </footer>
    </article>
  );
}

function PreviewMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">{label}</span>
      <span className="font-bold text-hicotech-navy dark:text-white">{value}</span>
    </div>
  );
}

type PartyRow = Readonly<{
  id: string;
  value?: string;
}>;

function PartyBlock({ rows, title }: { rows: readonly PartyRow[]; title: string }) {
  const visibleRows = rows.filter((row) => Boolean(row.value));

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-hicotech-dark-border dark:bg-slate-900/30">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-hicotech-blue">{title}</p>
      <div className="mt-3 space-y-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
        {visibleRows.map((row) => <p key={row.id}>{row.value}</p>)}
      </div>
    </div>
  );
}

function PreviewTotal({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 border-b border-slate-100 py-2 last:border-0 dark:border-hicotech-dark-border ${strong ? "text-base font-black text-hicotech-navy dark:text-white" : "text-sm font-semibold text-slate-600 dark:text-slate-300"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function formatQuantity(value: number) {
  return Number.isInteger(value) ? String(value) : value.toLocaleString("fr-MA", { maximumFractionDigits: 2 });
}
