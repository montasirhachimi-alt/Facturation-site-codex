import type { PdfLayoutDocument } from "@/components/pdf-templates/PdfLayout";
import { calculatePdfPreviewTotals, formatPdfMoney } from "./sales-document-pdf.utils";

export function SalesDocumentTemplate({ document }: { document: PdfLayoutDocument }) {
  const totals = calculatePdfPreviewTotals(document);

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
            document.company?.name,
            document.company?.address,
            document.company?.city,
            document.company?.ice ? `ICE ${document.company.ice}` : undefined,
            document.company?.phone,
            document.company?.email
          ]}
        />
        <PartyBlock
          title={document.recipient.label}
          rows={[
            document.recipient.name,
            document.recipient.company,
            document.recipient.address,
            document.recipient.city,
            document.recipient.ice ? `ICE ${document.recipient.ice}` : undefined,
            document.recipient.phone,
            document.recipient.email
          ]}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 dark:border-hicotech-dark-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-hicotech-navy text-left text-white">
              <tr>
                <th className="px-4 py-3 font-bold">Référence</th>
                <th className="px-4 py-3 font-bold">Désignation</th>
                <th className="px-4 py-3 text-right font-bold">Qté</th>
                <th className="px-4 py-3 text-right font-bold">PU</th>
                <th className="px-4 py-3 text-right font-bold">TVA</th>
                <th className="px-4 py-3 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-hicotech-dark-border">
              {document.lines.map((line, index) => (
                <tr key={`${line.reference}-${index}`} className="bg-white odd:bg-slate-50/70 dark:bg-hicotech-dark-card dark:odd:bg-slate-900/25">
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{line.reference}</td>
                  <td className="px-4 py-3 font-semibold">{line.designation}</td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{formatQuantity(line.quantity)}</td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{formatPdfMoney(line.unitPrice)}</td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{line.vat}%</td>
                  <td className="px-4 py-3 text-right font-bold">{formatPdfMoney(line.quantity * line.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="grid gap-4 pt-5 md:grid-cols-[1fr_300px]">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:border-hicotech-dark-border dark:bg-slate-900/30 dark:text-slate-300">
          <p className="font-bold text-hicotech-navy dark:text-white">Conditions</p>
          <p className="mt-1">{document.paymentTerms ?? "Conditions commerciales selon accord."}</p>
          {document.notes ? <p className="mt-3">{document.notes}</p> : null}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
          <PreviewTotal label="Sous-total" value={formatPdfMoney(totals.subtotal)} />
          <PreviewTotal label="TVA" value={formatPdfMoney(totals.tax)} />
          <PreviewTotal label="Remise" value={formatPdfMoney(totals.discount)} />
          <PreviewTotal label="Total TTC" value={formatPdfMoney(totals.total)} strong />
          {document.paidAmount !== undefined ? (
            <>
              <PreviewTotal label="Payé" value={formatPdfMoney(totals.paid)} />
              <PreviewTotal label="Reste à payer" value={formatPdfMoney(totals.remaining)} strong />
            </>
          ) : null}
        </div>
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

function PartyBlock({ rows, title }: { rows: readonly (string | undefined)[]; title: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-hicotech-dark-border dark:bg-slate-900/30">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-hicotech-blue">{title}</p>
      <div className="mt-3 space-y-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
        {rows.filter(Boolean).map((row) => <p key={row}>{row}</p>)}
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

