"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Download,
  Edit3,
  FileSpreadsheet,
  ImageIcon,
  PackagePlus,
  Plus,
  Search,
  Trash2,
  Upload,
  X
} from "lucide-react";
import * as XLSX from "xlsx";
import { clsx } from "clsx";
import type { StockMovement, StockMovementType, StockProduct } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  buildTemplateRows,
  normalizeImportedProduct,
  productImportColumns,
  productToExportRow,
  readProductsFromStorage,
  writeProductsToStorage,
  type ProductImportPreviewRow
} from "@/lib/product-tools";

type ProductFormState = Omit<StockProduct, "id">;

const emptyProduct: ProductFormState = {
  reference: "",
  designation: "",
  description: "",
  category: "Équipement",
  imageUrl: "",
  purchasePrice: 0,
  salePrice: 0,
  vat: 20,
  stock: 0,
  minStock: 0,
  unit: "Pièce"
};

const pageSize = 5;

export function StockModule({
  initialProducts,
  initialMovements
}: {
  initialProducts: StockProduct[];
  initialMovements: StockMovement[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [movements, setMovements] = useState(initialMovements);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Toutes");
  const [stockFilter, setStockFilter] = useState("Tous");
  const [page, setPage] = useState(1);
  const [editingProduct, setEditingProduct] = useState<StockProduct | null>(null);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProduct);
  const [movementProduct, setMovementProduct] = useState<StockProduct | null>(null);
  const [movementType, setMovementType] = useState<StockMovementType>("Entrée");
  const [movementQuantity, setMovementQuantity] = useState(1);
  const [movementReason, setMovementReason] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importRows, setImportRows] = useState<ProductImportPreviewRow[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importSummary, setImportSummary] = useState<{ imported: number; updated: number; ignored: number; errors: number } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const skipFirstProductsWrite = useRef(true);

  useEffect(() => {
    setProducts(readProductsFromStorage(initialProducts));
  }, [initialProducts]);

  useEffect(() => {
    if (skipFirstProductsWrite.current) {
      skipFirstProductsWrite.current = false;
      return;
    }
    writeProductsToStorage(products);
  }, [products]);

  const categories = useMemo(
    () => ["Toutes", ...Array.from(new Set(products.map((product) => product.category)))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.toLowerCase();

    return products.filter((product) => {
      const matchesQuery = [product.reference, product.designation, product.description, product.category]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesCategory = category === "Toutes" || product.category === category;
      const critical = product.minStock > 0 && product.stock <= product.minStock;
      const outOfStock = product.stock === 0;
      const matchesStock =
        stockFilter === "Tous" ||
        (stockFilter === "Critique" && critical) ||
        (stockFilter === "Rupture" && outOfStock) ||
        (stockFilter === "Disponible" && product.stock > product.minStock);

      return matchesQuery && matchesCategory && matchesStock;
    });
  }, [category, products, query, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const visibleProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);
  const criticalProducts = products.filter((product) => product.minStock > 0 && product.stock <= product.minStock);
  const stockValue = products.reduce((sum, product) => sum + product.stock * product.salePrice * (1 + product.vat / 100), 0);

  function openCreateProduct() {
    setEditingProduct(null);
    setProductForm({ ...emptyProduct });
    setProductFormOpen(true);
  }

  function openEditProduct(product: StockProduct) {
    setEditingProduct(product);
    setProductForm({
      reference: product.reference,
      designation: product.designation,
      description: product.description,
      category: product.category,
      imageUrl: product.imageUrl,
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      vat: product.vat,
      stock: product.stock,
      minStock: product.minStock,
      unit: product.unit || "Pièce"
    });
    setProductFormOpen(true);
  }

  function closeProductForm() {
    setEditingProduct(null);
    setProductForm({ ...emptyProduct });
    setProductFormOpen(false);
  }

  function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingProduct) {
      setProducts((current) =>
        current.map((product) => (product.id === editingProduct.id ? { ...editingProduct, ...productForm } : product))
      );
    } else {
      setProducts((current) => [
        { id: `prod-${Date.now()}`, ...productForm },
        ...current
      ]);
    }
    setPage(1);
    closeProductForm();
  }

  function deleteProduct(productId: string) {
    setProducts((current) => current.filter((product) => product.id !== productId));
  }

  function openMovement(product: StockProduct, type: StockMovementType) {
    setMovementProduct(product);
    setMovementType(type);
    setMovementQuantity(1);
    setMovementReason(type === "Entrée" ? "Entrée stock" : "Sortie stock");
  }

  function saveMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!movementProduct) return;

    const signedQuantity =
      movementType === "Entrée" ? movementQuantity : movementType === "Sortie" ? -movementQuantity : movementQuantity;

    setProducts((current) =>
      current.map((product) =>
        product.id === movementProduct.id
          ? { ...product, stock: Math.max(0, product.stock + signedQuantity) }
          : product
      )
    );
    setMovements((current) => [
      {
        id: `mov-${Date.now()}`,
        productReference: movementProduct.reference,
        productName: movementProduct.designation,
        type: movementType,
        quantity: signedQuantity,
        reason: movementReason,
        date: new Date().toISOString()
      },
      ...current
    ]);
    setMovementProduct(null);
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImportError(null);
    setImportSummary(null);
    setImportFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });
      const seenReferences = new Set<string>();
      const previewRows = rawRows.map((row, index) =>
        normalizeImportedProduct(normalizeImportSource(row), index + 2, products, seenReferences)
      );

      if (previewRows.length === 0) {
        setImportError("Le fichier ne contient aucune ligne produit.");
        return;
      }

      setImportRows(previewRows);
    } catch {
      setImportError("Impossible de lire le fichier. Vérifiez le format .xlsx ou .csv.");
    }
  }

  function setImportAction(rowId: string, status: "update" | "ignore") {
    setImportRows((current) =>
      current.map((row) => row.id === rowId && row.errors.length === 0 ? { ...row, status } : row)
    );
  }

  function confirmImport() {
    let imported = 0;
    let updated = 0;
    const errors = importRows.filter((row) => row.status === "error").length;
    const ignored = importRows.filter((row) => row.status === "ignore").length;

    setProducts((current) => {
      const next = [...current];
      importRows.forEach((row) => {
        if (!row.product || row.status === "error" || row.status === "ignore") return;
        const existingIndex = next.findIndex((product) => sameReference(product.reference, row.product?.reference ?? ""));
        if (existingIndex >= 0) {
          next[existingIndex] = { ...next[existingIndex], ...row.product };
          updated += 1;
        } else {
          next.unshift({ id: `prod-${Date.now()}-${Math.random().toString(16).slice(2)}`, ...row.product });
          imported += 1;
        }
      });
      return next;
    });
    setImportSummary({ imported, updated, ignored, errors });
    setPage(1);
  }

  function downloadTemplate() {
    downloadWorkbook("modele-produits-hicotech.xlsx", buildTemplateRows());
  }

  function exportProducts() {
    downloadWorkbook("produits-hicotech.xlsx", products.map(productToExportRow));
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Produits" value={products.length.toString()} />
        <SummaryCard label="Stock critique" value={criticalProducts.length.toString()} tone="red" />
        <SummaryCard label="Valeur stock TTC" value={formatCurrency(stockValue)} />
        <SummaryCard label="Mouvements" value={movements.length.toString()} />
      </div>

      {criticalProducts.length > 0 && (
        <section className="rounded-lg border border-hicotech-red/30 bg-red-50 p-4 dark:bg-red-950/20">
          <div className="flex items-center gap-3 text-hicotech-red">
            <AlertTriangle size={20} />
            <h2 className="font-display text-lg font-bold">Alertes stock critique</h2>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {criticalProducts.map((product) => (
              <div key={product.id} className="rounded-lg bg-white p-3 text-sm shadow-sm dark:bg-hicotech-dark-card">
                <p className="font-bold text-hicotech-navy dark:text-white">{product.designation}</p>
                <p className="mt-1 text-slate-500 dark:text-slate-300">
                  Stock {product.stock} / minimum {product.minStock}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-hicotech-dark-border xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px] xl:flex-1">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50">
              <Search size={18} className="text-slate-400" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                className="w-full bg-transparent text-sm outline-none dark:text-white dark:placeholder:text-slate-400"
                placeholder="Rechercher référence, désignation, description..."
              />
            </div>
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white"
            >
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={stockFilter}
              onChange={(event) => {
                setStockFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white"
            >
              {["Tous", "Disponible", "Critique", "Rupture"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <input ref={fileInputRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={handleImportFile} />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy transition hover:bg-hicotech-sky dark:border-hicotech-dark-border dark:text-white dark:hover:bg-hicotech-blue/20">
              <Upload size={18} />
              Importer produits
            </button>
            <button type="button" onClick={downloadTemplate} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy transition hover:bg-hicotech-sky dark:border-hicotech-dark-border dark:text-white dark:hover:bg-hicotech-blue/20">
              <FileSpreadsheet size={18} />
              Modèle Excel
            </button>
            <button type="button" onClick={exportProducts} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy transition hover:bg-hicotech-sky dark:border-hicotech-dark-border dark:text-white dark:hover:bg-hicotech-blue/20">
              <Download size={18} />
              Export Excel
            </button>
            <button
              type="button"
              onClick={openCreateProduct}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-blue-700"
            >
              <Plus size={18} />
              Ajouter produit
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-sm">
            <thead>
              <tr className="bg-hicotech-sky/70 text-left text-hicotech-navy dark:bg-hicotech-blue/20 dark:text-white">
                {["Image", "Référence", "Désignation", "Catégorie", "Unité", "Prix achat", "Prix vente", "TVA", "Prix TTC", "Stock", "Actions"].map((column) => (
                  <th key={column} className="px-4 py-3 font-display text-xs font-bold uppercase">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => {
                const priceTtc = product.salePrice * (1 + product.vat / 100);
                const critical = product.minStock > 0 && product.stock <= product.minStock;

                return (
                  <tr key={product.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                    <td className="px-4 py-4">
                      <div className="grid size-12 place-items-center rounded-lg bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-dark-page/60">
                        {product.imageUrl ? <span className="text-xs font-bold">IMG</span> : <ImageIcon size={20} />}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{product.reference}</td>
                    <td className="max-w-72 px-4 py-4">
                      <p className="font-bold text-hicotech-navy dark:text-white">{product.designation}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-300">{product.description}</p>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200">{product.category}</td>
                    <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200">{product.unit || "Pièce"}</td>
                    <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200">{formatCurrency(product.purchasePrice)}</td>
                    <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200">{formatCurrency(product.salePrice)}</td>
                    <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200">{product.vat}%</td>
                    <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{formatCurrency(priceTtc)}</td>
                    <td className="px-4 py-4">
                      <span
                        className={clsx(
                          "rounded-md px-2 py-1 text-xs font-bold",
                          critical ? "bg-red-50 text-hicotech-red" : "bg-emerald-50 text-hicotech-green"
                        )}
                      >
                        {product.stock} / min. {product.minStock}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <IconButton label="Modifier" onClick={() => openEditProduct(product)} icon={<Edit3 size={16} />} />
                        <IconButton label="Entrée" onClick={() => openMovement(product, "Entrée")} icon={<ArrowDownCircle size={16} />} />
                        <IconButton label="Sortie" onClick={() => openMovement(product, "Sortie")} icon={<ArrowUpCircle size={16} />} />
                        <IconButton label="Supprimer" onClick={() => deleteProduct(product.id)} icon={<Trash2 size={16} />} danger />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 p-4 text-sm dark:border-hicotech-dark-border md:flex-row md:items-center md:justify-between">
          <p className="text-slate-500 dark:text-slate-300">
            {filteredProducts.length} produit(s) trouvé(s)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="rounded-lg border border-slate-200 px-3 py-2 font-semibold disabled:opacity-40 dark:border-hicotech-dark-border"
            >
              Précédent
            </button>
            <span className="font-bold text-hicotech-navy dark:text-white">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              className="rounded-lg border border-slate-200 px-3 py-2 font-semibold disabled:opacity-40 dark:border-hicotech-dark-border"
            >
              Suivant
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="mb-4 flex items-center gap-3">
          <PackagePlus className="text-hicotech-blue" size={22} />
          <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">
            Historique des mouvements
          </h2>
        </div>
        <div className="space-y-3">
          {movements.slice(0, 8).map((movement) => (
            <div key={movement.id} className="grid gap-3 rounded-lg border border-slate-200 p-4 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40 md:grid-cols-[120px_1fr_120px_140px]">
              <span className="font-bold text-hicotech-navy dark:text-white">{formatDate(movement.date)}</span>
              <div>
                <p className="font-bold text-hicotech-navy dark:text-white">{movement.productName}</p>
                <p className="text-slate-500 dark:text-slate-300">{movement.productReference} - {movement.reason}</p>
              </div>
              <span className={movement.type === "Sortie" ? "font-bold text-hicotech-red" : "font-bold text-hicotech-green"}>
                {movement.type}
              </span>
              <span className="font-bold text-hicotech-navy dark:text-white">
                {movement.quantity > 0 ? "+" : ""}{movement.quantity}
              </span>
            </div>
          ))}
        </div>
      </section>

      {productFormOpen && (
        <ProductModal
          form={productForm}
          title={editingProduct ? "Modifier produit" : "Ajouter produit"}
          onChange={setProductForm}
          onClose={closeProductForm}
          onSubmit={saveProduct}
        />
      )}

      {(importRows.length > 0 || importError || importSummary) && (
        <ImportProductsModal
          fileName={importFileName}
          rows={importRows}
          summary={importSummary}
          error={importError}
          onActionChange={setImportAction}
          onConfirm={confirmImport}
          onClose={() => {
            setImportRows([]);
            setImportFileName("");
            setImportSummary(null);
            setImportError(null);
          }}
        />
      )}

      {movementProduct && (
        <MovementModal
          product={movementProduct}
          movementType={movementType}
          quantity={movementQuantity}
          reason={movementReason}
          onTypeChange={setMovementType}
          onQuantityChange={setMovementQuantity}
          onReasonChange={setMovementReason}
          onClose={() => setMovementProduct(null)}
          onSubmit={saveMovement}
        />
      )}
    </div>
  );
}

function normalizeImportSource(row: Record<string, unknown>) {
  const normalized: Record<string, unknown> = {};
  Object.entries(row).forEach(([key, value]) => {
    const cleanKey = key.trim().toLowerCase().replace(/\s+/g, "_");
    normalized[cleanKey] = value;
  });
  productImportColumns.forEach((column) => {
    normalized[column] ??= "";
  });
  return normalized;
}

function sameReference(first: string, second: string) {
  return first.trim().toLowerCase() === second.trim().toLowerCase();
}

function downloadWorkbook(fileName: string, rows: Record<string, unknown>[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...productImportColumns] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Produits");
  XLSX.writeFile(workbook, fileName);
}

function SummaryCard({ label, value, tone = "blue" }: { label: string; value: string; tone?: "blue" | "red" }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">{label}</p>
      <p className={clsx("mt-2 font-display text-2xl font-bold", tone === "red" ? "text-hicotech-red" : "text-hicotech-navy dark:text-white")}>
        {value}
      </p>
    </article>
  );
}

function IconButton({ label, icon, danger, onClick }: { label: string; icon: React.ReactNode; danger?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-bold transition",
        danger
          ? "border-red-200 text-hicotech-red hover:bg-red-50"
          : "border-slate-200 text-hicotech-navy hover:bg-hicotech-sky dark:border-hicotech-dark-border dark:text-white dark:hover:bg-hicotech-blue/20"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ImportProductsModal({
  fileName,
  rows,
  summary,
  error,
  onActionChange,
  onConfirm,
  onClose
}: {
  fileName: string;
  rows: ProductImportPreviewRow[];
  summary: { imported: number; updated: number; ignored: number; errors: number } | null;
  error: string | null;
  onActionChange: (rowId: string, status: "update" | "ignore") => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const pendingRows = rows.filter((row) => row.status !== "error" && row.status !== "ignore").length;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-hicotech-dark-sidebar/70 px-4 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <ModalTitle title="Importer produits" onClose={onClose} />
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{fileName || "Fichier sélectionné"}</p>

        {error && (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-hicotech-red dark:bg-red-950/20">
            {error}
          </p>
        )}

        {summary && (
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <MiniStat label="Importés" value={summary.imported} />
            <MiniStat label="Mis à jour" value={summary.updated} />
            <MiniStat label="Ignorés" value={summary.ignored} />
            <MiniStat label="Erreurs" value={summary.errors} danger={summary.errors > 0} />
          </div>
        )}

        {rows.length > 0 && (
          <>
            <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200 dark:border-hicotech-dark-border">
              <table className="w-full min-w-[1120px] text-sm">
                <thead>
                  <tr className="bg-hicotech-sky/70 text-left text-hicotech-navy dark:bg-hicotech-blue/20 dark:text-white">
                    {["Ligne", "Référence", "Désignation", "Catégorie", "Prix HT", "TVA", "Stock", "Action", "Erreurs"].map((column) => (
                      <th key={column} className="px-3 py-3 font-display text-xs font-bold uppercase">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                      <td className="px-3 py-3 font-bold text-hicotech-navy dark:text-white">{row.lineNumber}</td>
                      <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{row.product?.reference ?? String(row.source.reference ?? "")}</td>
                      <td className="px-3 py-3 text-slate-700 dark:text-slate-200">{row.product?.designation ?? String(row.source.designation ?? "")}</td>
                      <td className="px-3 py-3 text-slate-700 dark:text-slate-200">{row.product?.category ?? String(row.source.categorie ?? "")}</td>
                      <td className="px-3 py-3 text-slate-700 dark:text-slate-200">{row.product ? formatCurrency(row.product.salePrice) : "-"}</td>
                      <td className="px-3 py-3 text-slate-700 dark:text-slate-200">{row.product ? `${row.product.vat}%` : "-"}</td>
                      <td className="px-3 py-3 text-slate-700 dark:text-slate-200">{row.product?.stock ?? "-"}</td>
                      <td className="px-3 py-3">
                        {row.status === "error" ? (
                          <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-hicotech-red">Erreur</span>
                        ) : row.status === "new" ? (
                          <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-hicotech-green">Créer</span>
                        ) : (
                          <select value={row.status} onChange={(event) => onActionChange(row.id, event.target.value as "update" | "ignore")} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
                            <option value="update">Mettre à jour</option>
                            <option value="ignore">Ignorer</option>
                          </select>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {row.errors.length > 0 ? (
                          <span className="text-xs font-bold text-hicotech-red">{row.errors.join(", ")}</span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">Aucune</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">Fermer</button>
              <button type="button" disabled={pendingRows === 0} onClick={onConfirm} className="rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-50">Valider l&apos;import</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function MiniStat({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50">
      <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-300">{label}</p>
      <p className={clsx("mt-1 font-display text-2xl font-bold", danger ? "text-hicotech-red" : "text-hicotech-navy dark:text-white")}>{value}</p>
    </article>
  );
}

function ProductModal({
  title,
  form,
  onChange,
  onClose,
  onSubmit
}: {
  title: string;
  form: ProductFormState;
  onChange: (form: ProductFormState) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  function update<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    onChange({ ...form, [key]: value });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-hicotech-dark-sidebar/70 px-4 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <ModalTitle title={title} onClose={onClose} />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Référence" value={form.reference} onChange={(value) => update("reference", value)} required />
          <Field label="Désignation" value={form.designation} onChange={(value) => update("designation", value)} required />
          <Field label="Catégorie" value={form.category} onChange={(value) => update("category", value)} required />
          <Field label="Image" value={form.imageUrl} onChange={(value) => update("imageUrl", value)} placeholder="URL de l'image" />
          <Field label="Prix achat HT" type="number" value={form.purchasePrice} onChange={(value) => update("purchasePrice", Number(value))} />
          <Field label="Prix vente HT" type="number" value={form.salePrice} onChange={(value) => update("salePrice", Number(value))} />
          <Field label="TVA" type="number" value={form.vat} onChange={(value) => update("vat", Number(value))} />
          <Field label="Prix TTC" value={formatCurrency(form.salePrice * (1 + form.vat / 100))} onChange={() => undefined} disabled />
          <Field label="Quantité en stock" type="number" value={form.stock} onChange={(value) => update("stock", Number(value))} />
          <Field label="Stock minimum" type="number" value={form.minStock} onChange={(value) => update("minStock", Number(value))} />
          <Field label="Unité" value={form.unit} onChange={(value) => update("unit", value)} required />
          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-hicotech-navy dark:text-white">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              className="mt-2 min-h-28 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-hicotech-blue/20 transition focus:border-hicotech-blue focus:ring-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white"
            />
          </label>
        </div>
        <ModalActions onClose={onClose} submitLabel="Enregistrer" />
      </form>
    </div>
  );
}

function MovementModal({
  product,
  movementType,
  quantity,
  reason,
  onTypeChange,
  onQuantityChange,
  onReasonChange,
  onClose,
  onSubmit
}: {
  product: StockProduct;
  movementType: StockMovementType;
  quantity: number;
  reason: string;
  onTypeChange: (type: StockMovementType) => void;
  onQuantityChange: (quantity: number) => void;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-hicotech-dark-sidebar/70 px-4 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <ModalTitle title="Mouvement de stock" onClose={onClose} />
        <p className="mt-4 rounded-lg bg-hicotech-sky p-3 text-sm font-bold text-hicotech-navy dark:bg-hicotech-dark-page/50 dark:text-white">
          {product.reference} - {product.designation}
        </p>
        <div className="mt-6 grid gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-hicotech-navy dark:text-white">Type</span>
            <select
              value={movementType}
              onChange={(event) => onTypeChange(event.target.value as StockMovementType)}
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white"
            >
              <option>Entrée</option>
              <option>Sortie</option>
              <option>Ajustement</option>
            </select>
          </label>
          <Field label="Quantité" type="number" value={quantity} onChange={(value) => onQuantityChange(Math.max(1, Number(value)))} />
          <Field label="Motif" value={reason} onChange={onReasonChange} required />
        </div>
        <ModalActions onClose={onClose} submitLabel="Valider le mouvement" />
      </form>
    </div>
  );
}

function ModalTitle({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <h2 className="font-display text-2xl font-bold text-hicotech-navy dark:text-white">{title}</h2>
      <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 p-2 text-hicotech-navy dark:border-hicotech-dark-border dark:text-white" aria-label="Fermer">
        <X size={18} />
      </button>
    </div>
  );
}

function ModalActions({ onClose, submitLabel }: { onClose: () => void; submitLabel: string }) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">
        Annuler
      </button>
      <button type="submit" className="rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft">
        {submitLabel}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  type = "text",
  placeholder,
  required,
  disabled,
  onChange
}: {
  label: string;
  value: string | number;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-hicotech-navy dark:text-white">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-hicotech-blue/20 transition focus:border-hicotech-blue focus:ring-4 disabled:bg-slate-100 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white dark:disabled:bg-hicotech-dark-page"
      />
    </label>
  );
}
