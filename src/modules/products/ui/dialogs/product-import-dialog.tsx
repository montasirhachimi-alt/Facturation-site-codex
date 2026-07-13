"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";
import { EntityDialog } from "@/ui/dialogs/entity-dialog";
import { FormActions, FormField, entityInputClassName } from "@/ui/forms/form-field";
import { importProductCatalog } from "@/platform/persistence";
import {
  PRODUCT_IMPORT_COLUMNS,
  validateProductImportRows,
  type Product,
  type ProductCategory,
  type ProductImportDuplicatePolicy,
  type ProductImportMapping,
  type ProductImportPreview
} from "../..";
import { downloadProductImportErrorReport, parseProductImportFile, type ParsedProductImportFile } from "../product-file-io";

export function ProductImportDialog({
  categories,
  existingProducts,
  onClose,
  onImported,
  open
}: {
  categories: readonly ProductCategory[];
  existingProducts: readonly Product[];
  onClose: () => void;
  onImported: (message: string) => void;
  open: boolean;
}) {
  const [parsedFile, setParsedFile] = useState<ParsedProductImportFile | null>(null);
  const [mapping, setMapping] = useState<ProductImportMapping>({});
  const [duplicatePolicy, setDuplicatePolicy] = useState<ProductImportDuplicatePolicy>("stop");
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const preview = useMemo<ProductImportPreview | null>(() => {
    if (!parsedFile) return null;
    return validateProductImportRows(parsedFile.rows, mapping, {
      existingProducts,
      categories,
      duplicatePolicy
    });
  }, [categories, duplicatePolicy, existingProducts, mapping, parsedFile]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResultMessage(null);
    try {
      const parsed = await parseProductImportFile(file);
      setParsedFile(parsed);
      setMapping(parsed.mapping);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Lecture du fichier impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmImport() {
    if (!parsedFile || !preview || busy) return false;
    if (preview.invalidRows > 0) {
      setError("Corrigez les erreurs avant de confirmer l'import.");
      return false;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await importProductCatalog({
        rows: parsedFile.rows,
        mapping,
        duplicatePolicy
      });
      const message = [
        result.importedCount ? `${result.importedCount} produits importés.` : "",
        result.updatedCount ? `${result.updatedCount} produits mis à jour.` : "",
        result.ignoredCount ? `${result.ignoredCount} lignes ignorées.` : ""
      ].filter(Boolean).join(" ");
      setResultMessage(message || "Aucune ligne importée.");
      onImported(message || "Import terminé.");
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "L'import a échoué.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function close() {
    setParsedFile(null);
    setMapping({});
    setDuplicatePolicy("stop");
    setError(null);
    setResultMessage(null);
    onClose();
  }

  return (
    <EntityDialog
      open={open}
      onClose={busy ? () => undefined : close}
      onSubmit={confirmImport}
      size="xl"
      eyebrow="Catalogue produits"
      title="Importer des produits"
      description="Chargez un fichier XLSX ou CSV, vérifiez le mapping, corrigez les erreurs puis confirmez l'import."
      error={error}
      footer={<FormActions onCancel={close} submitBusy={busy} submitDisabled={!preview || preview.invalidRows > 0 || preview.validRows === 0} submitLabel="Confirmer l'import" />}
    >
      <div className="grid gap-4">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-hicotech-blue hover:bg-hicotech-blue/5 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/35">
          <Upload size={26} className="text-hicotech-blue" />
          <span className="mt-3 text-sm font-black text-hicotech-navy dark:text-white">{parsedFile?.fileName ?? "Choisir un fichier XLSX ou CSV"}</span>
          <span className="mt-1 text-xs font-semibold text-slate-500">Maximum 5 Mo, 1 000 lignes. Les macros ne sont pas supportées.</span>
          <input type="file" accept=".xlsx,.csv" className="sr-only" onChange={(event) => void handleFile(event.target.files?.[0])} />
        </label>

        {parsedFile && (
          <section className="rounded-2xl border border-slate-200 p-4 dark:border-hicotech-dark-border">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="font-display text-base font-black text-hicotech-navy dark:text-white">Mapping des colonnes</h3>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-300">SKU et Nom sont obligatoires. Le mapping automatique peut être ajusté avant validation.</p>
              </div>
              <select value={duplicatePolicy} onChange={(event) => setDuplicatePolicy(event.target.value as ProductImportDuplicatePolicy)} className={`${entityInputClassName} mt-0 max-w-xs`}>
                <option value="stop">Arrêter sur doublon</option>
                <option value="ignore">Ignorer les doublons</option>
                <option value="update">Mettre à jour par SKU</option>
              </select>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {PRODUCT_IMPORT_COLUMNS.map((column) => (
                <FormField key={column.key} label={`${column.label}${column.required ? " *" : ""}`}>
                  <select value={mapping[column.key] ?? ""} onChange={(event) => setMapping((current) => ({ ...current, [column.key]: event.target.value || undefined }))} className={entityInputClassName}>
                    <option value="">Non importé</option>
                    {parsedFile.headers.map((header) => <option key={header} value={header}>{header}</option>)}
                  </select>
                </FormField>
              ))}
            </div>
          </section>
        )}

        {preview && <ImportPreview preview={preview} />}

        {resultMessage && (
          <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
            <CheckCircle2 size={16} /> {resultMessage}
          </p>
        )}
      </div>
    </EntityDialog>
  );
}

function ImportPreview({ preview }: { preview: ProductImportPreview }) {
  return (
    <section className="rounded-2xl border border-slate-200 p-4 dark:border-hicotech-dark-border">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="font-display text-base font-black text-hicotech-navy dark:text-white">Preview import</h3>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-300">
            {preview.totalRows} lignes · {preview.validRows} valides · {preview.invalidRows} invalides · {preview.newProducts} nouvelles · {preview.productsToUpdate} mises à jour · {preview.ignoredRows} ignorées
          </p>
        </div>
        {preview.issues.length > 0 && (
          <button type="button" onClick={() => downloadProductImportErrorReport(preview.issues)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-hicotech-navy transition hover:bg-slate-50 dark:border-hicotech-dark-border dark:text-white dark:hover:bg-white/10">
            <FileSpreadsheet size={16} /> Rapport erreurs
          </button>
        )}
      </div>

      {preview.issues.length > 0 && (
        <div className="mt-4 max-h-44 overflow-y-auto rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-400/10 dark:text-red-200">
          {preview.issues.slice(0, 8).map((issue, index) => (
            <p key={`${issue.rowNumber}-${issue.column}-${index}`} className="flex gap-2 font-semibold">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              Ligne {issue.rowNumber}, {issue.column}: {issue.message} {issue.suggestion ? `(${issue.suggestion})` : ""}
            </p>
          ))}
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-hicotech-dark-border">
          <thead className="bg-slate-50 text-left text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 dark:bg-hicotech-dark-page/40">
            <tr>
              <th className="px-3 py-2">Ligne</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Nom</th>
              <th className="px-3 py-2">Prix vente</th>
              <th className="px-3 py-2">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-hicotech-dark-border/70">
            {preview.rows.slice(0, 8).map((row) => (
              <tr key={row.rowNumber}>
                <td className="px-3 py-2 font-bold">{row.rowNumber}</td>
                <td className="px-3 py-2 font-bold">{actionLabel(row.action)}</td>
                <td className="px-3 py-2 font-mono text-xs font-black">{row.values.sku || "-"}</td>
                <td className="px-3 py-2 font-semibold">{row.values.name || "-"}</td>
                <td className="px-3 py-2 font-semibold">{Number.isFinite(row.values.sellingPrice) ? row.values.sellingPrice : "-"}</td>
                <td className="px-3 py-2 font-semibold">{row.issues.length ? "Erreur" : "OK"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function actionLabel(action: string) {
  if (action === "create") return "Créer";
  if (action === "update") return "Mettre à jour";
  if (action === "ignore") return "Ignorer";
  return "Invalide";
}
