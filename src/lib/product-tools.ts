import type { QuoteLine, StockProduct } from "@/lib/types";

export const productImportColumns = [
  "reference",
  "designation",
  "description",
  "categorie",
  "prix_achat_ht",
  "prix_vente_ht",
  "tva",
  "prix_vente_ttc",
  "stock_initial",
  "stock_minimum",
  "unite"
] as const;

export const productsStorageKey = "hicotech-products-company-hicotech";

export type ImportedProductDraft = Omit<StockProduct, "id">;

export type ProductImportPreviewRow = {
  id: string;
  lineNumber: number;
  source: Record<string, unknown>;
  product: ImportedProductDraft | null;
  status: "new" | "update" | "ignore" | "error";
  errors: string[];
  duplicateInFile: boolean;
};

type ProductLine = Pick<QuoteLine, "productId" | "reference" | "designation" | "quantity">;

export function withProductDefaults(product: StockProduct): StockProduct {
  return {
    ...product,
    unit: product.unit || "Pièce"
  };
}

export function readProductsFromStorage(fallback: StockProduct[]): StockProduct[] {
  if (typeof window === "undefined") return fallback.map(withProductDefaults);

  try {
    const raw = window.localStorage.getItem(productsStorageKey);
    if (!raw) return fallback.map(withProductDefaults);
    const parsed = JSON.parse(raw) as StockProduct[];
    return parsed.map(withProductDefaults);
  } catch {
    return fallback.map(withProductDefaults);
  }
}

export function writeProductsToStorage(products: StockProduct[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(productsStorageKey, JSON.stringify(products.map(withProductDefaults)));
  window.dispatchEvent(new CustomEvent("hicotech-products-updated"));
}

export function findProductByReferenceOrDesignation(value: string, products: StockProduct[]) {
  const query = normalizeText(value);
  if (!query) return undefined;

  return products.find((product) => normalizeText(product.reference) === query)
    ?? products.find((product) => normalizeText(product.designation) === query)
    ?? products.find((product) => `${normalizeText(product.reference)} ${normalizeText(product.designation)}`.includes(query));
}

export function createDocumentLineFromProduct(product?: StockProduct, prefix = "line"): QuoteLine {
  return {
    id: `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    productId: product?.id ?? "",
    reference: product?.reference ?? "",
    designation: product?.designation ?? "",
    description: product?.description ?? "",
    quantity: 1,
    unitPrice: product?.salePrice ?? 0,
    vat: product?.vat ?? 20,
    unit: product?.unit ?? "Pièce"
  };
}

export function fillDocumentLineFromProduct(lineId: string, product: StockProduct): Partial<QuoteLine> {
  return {
    id: lineId,
    productId: product.id,
    reference: product.reference,
    designation: product.designation,
    description: product.description,
    unitPrice: product.salePrice,
    vat: product.vat,
    unit: product.unit || "Pièce"
  };
}

export function applyStockChange(lines: ProductLine[], direction: "sale" | "sale-cancel" | "purchase", fallbackProducts: StockProduct[] = []) {
  if (typeof window === "undefined") return;
  const products = readProductsFromStorage(fallbackProducts);
  if (products.length === 0) return;

  const multiplier = direction === "sale" ? -1 : 1;
  const updated = products.map((product) => {
    const matchingLines = lines.filter((line) =>
      line.productId === product.id || normalizeText(line.reference ?? "") === normalizeText(product.reference)
    );
    if (matchingLines.length === 0) return product;

    const quantity = matchingLines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
    return { ...product, stock: Math.max(0, product.stock + quantity * multiplier) };
  });

  writeProductsToStorage(updated);
}

export function normalizeImportedProduct(
  source: Record<string, unknown>,
  lineNumber: number,
  existingProducts: StockProduct[],
  seenReferences: Set<string>
): ProductImportPreviewRow {
  const reference = asText(source.reference).trim();
  const designation = asText(source.designation).trim();
  const vat = toNumber(source.tva, 20);
  const saleHtInput = toOptionalNumber(source.prix_vente_ht);
  const saleTtcInput = toOptionalNumber(source.prix_vente_ttc);
  const salePrice = saleHtInput ?? (saleTtcInput !== null ? saleTtcInput / (1 + vat / 100) : 0);
  const normalizedReference = normalizeText(reference);
  const errors: string[] = [];

  if (!reference) errors.push("Référence obligatoire");
  if (!designation) errors.push("Désignation obligatoire");
  if (vat < 0) errors.push("TVA invalide");
  if (salePrice < 0) errors.push("Prix de vente invalide");

  const duplicateInFile = normalizedReference !== "" && seenReferences.has(normalizedReference);
  if (duplicateInFile) errors.push("Référence en double dans le fichier");
  if (normalizedReference) seenReferences.add(normalizedReference);

  const existing = existingProducts.find((product) => normalizeText(product.reference) === normalizedReference);
  const product: ImportedProductDraft | null = errors.length > 0 ? null : {
    reference,
    designation,
    description: asText(source.description),
    category: asText(source.categorie) || "Non classé",
    imageUrl: "",
    purchasePrice: toNumber(source.prix_achat_ht, 0),
    salePrice: roundMoney(salePrice),
    vat,
    stock: toNumber(source.stock_initial, existing?.stock ?? 0),
    minStock: toNumber(source.stock_minimum, existing?.minStock ?? 0),
    unit: asText(source.unite) || "Pièce"
  };

  return {
    id: `import-${lineNumber}-${reference || Math.random().toString(16).slice(2)}`,
    lineNumber,
    source,
    product,
    status: errors.length > 0 ? "error" : existing ? "update" : "new",
    errors,
    duplicateInFile
  };
}

export function buildTemplateRows() {
  return [
    {
      reference: "",
      designation: "",
      description: "",
      categorie: "",
      prix_achat_ht: "",
      prix_vente_ht: "",
      tva: 20,
      prix_vente_ttc: "",
      stock_initial: "",
      stock_minimum: "",
      unite: "Pièce"
    }
  ];
}

export function productToExportRow(product: StockProduct) {
  return {
    reference: product.reference,
    designation: product.designation,
    description: product.description,
    categorie: product.category,
    prix_achat_ht: product.purchasePrice,
    prix_vente_ht: product.salePrice,
    tva: product.vat,
    prix_vente_ttc: roundMoney(product.salePrice * (1 + product.vat / 100)),
    stock_initial: product.stock,
    stock_minimum: product.minStock,
    unite: product.unit || "Pièce"
  };
}

function asText(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function toOptionalNumber(value: unknown) {
  const text = asText(value).replace(",", ".");
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNumber(value: unknown, fallback: number) {
  return toOptionalNumber(value) ?? fallback;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
