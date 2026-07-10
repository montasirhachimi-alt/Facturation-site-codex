"use client";

import { useEffect, useState } from "react";
import type { PdfLayoutDocument } from "@/components/pdf-templates/PdfLayout";
import { Download, Eye, Printer, X } from "lucide-react";
import { downloadSalesDocumentPdf, printSalesDocumentPdf } from "./sales-document-pdf.utils";
import { SalesDocumentTemplate } from "./sales-document-template";

export function SalesDocumentActions({ document }: { document: PdfLayoutDocument }) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Actions PDF">
        <button type="button" onClick={() => setPreviewOpen(true)} className={actionClassName}>
          <Eye size={15} />
          Aperçu PDF
        </button>
        <button type="button" onClick={() => void downloadSalesDocumentPdf(document)} className={actionClassName}>
          <Download size={15} />
          Télécharger PDF
        </button>
        <button type="button" onClick={() => void printSalesDocumentPdf(document)} className={actionClassName}>
          <Printer size={15} />
          Imprimer
        </button>
      </div>
      <SalesDocumentPreviewDialog document={document} open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </>
  );
}

export function SalesDocumentPreviewDialog({
  document,
  onClose,
  open
}: {
  document: PdfLayoutDocument;
  onClose: () => void;
  open: boolean;
}) {
  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    documentBody().style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      documentBody().style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 px-3 py-5 backdrop-blur-sm sm:px-6" role="dialog" aria-modal="true" aria-labelledby="sales-document-preview-title">
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-3">
        <div className="sticky top-0 z-10 flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/95 p-3 shadow-xl shadow-slate-950/15 backdrop-blur dark:bg-hicotech-dark-card/95 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-hicotech-blue">Aperçu PDF</p>
            <h2 id="sales-document-preview-title" className="font-display text-lg font-black text-hicotech-navy dark:text-white">{document.title} {document.number}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void downloadSalesDocumentPdf(document)} className={actionClassName}>
              <Download size={15} />
              Télécharger
            </button>
            <button type="button" onClick={() => void printSalesDocumentPdf(document)} className={actionClassName}>
              <Printer size={15} />
              Imprimer
            </button>
            <button type="button" onClick={onClose} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 transition hover:border-hicotech-blue/30 hover:text-hicotech-blue focus:outline-none focus:ring-4 focus:ring-hicotech-blue/15 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-slate-300">
              <X size={15} />
              Fermer
            </button>
          </div>
        </div>
        <SalesDocumentTemplate document={document} />
      </div>
    </div>
  );
}

const actionClassName = "inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-hicotech-navy shadow-sm shadow-slate-200/50 transition hover:border-hicotech-blue/30 hover:text-hicotech-blue focus:outline-none focus:ring-4 focus:ring-hicotech-blue/15 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-white dark:shadow-none";

function documentBody() {
  return document.body;
}

