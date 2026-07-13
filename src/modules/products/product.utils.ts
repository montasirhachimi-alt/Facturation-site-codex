import { DEFAULT_PRODUCT_CURRENCY, DEFAULT_PRODUCT_FLAGS, DEFAULT_PRODUCT_UNIT, DEFAULT_PRODUCT_VAT_RATE } from "./product.constants";
import type {
  CreateProductCategoryInput,
  CreateProductInput,
  Product,
  ProductCategory,
  ProductFilters,
  ProductSort,
  UpdateProductCategoryInput,
  UpdateProductInput
} from "./product.types";

export function normalizeSku(value: string) {
  return value.trim().replace(/\s+/g, "-").toUpperCase();
}

export function normalizeBarcode(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || undefined;
}

export function normalizeCurrency(value: string | undefined) {
  return (value?.trim() || DEFAULT_PRODUCT_CURRENCY).toUpperCase();
}

export function normalizeCreateProductInput(input: CreateProductInput) {
  return {
    ...input,
    sku: normalizeSku(input.sku),
    barcode: normalizeBarcode(input.barcode),
    name: input.name.trim(),
    description: optionalText(input.description),
    shortDescription: optionalText(input.shortDescription),
    categoryName: optionalText(input.categoryName),
    brand: optionalText(input.brand),
    unit: input.unit ?? DEFAULT_PRODUCT_UNIT,
    purchasePrice: roundMoney(input.purchasePrice ?? 0),
    sellingPrice: roundMoney(input.sellingPrice),
    vatRate: roundRate(input.vatRate ?? DEFAULT_PRODUCT_VAT_RATE),
    currency: normalizeCurrency(input.currency),
    image: optionalText(input.image),
    notes: optionalText(input.notes),
    flags: { ...DEFAULT_PRODUCT_FLAGS, ...(input.flags ?? {}) }
  };
}

export function normalizeUpdateProductInput(input: UpdateProductInput) {
  return {
    ...input,
    sku: input.sku === undefined ? undefined : normalizeSku(input.sku),
    barcode: input.barcode === undefined ? undefined : normalizeBarcode(input.barcode),
    name: input.name === undefined ? undefined : input.name.trim(),
    description: input.description === undefined ? undefined : optionalText(input.description),
    shortDescription: input.shortDescription === undefined ? undefined : optionalText(input.shortDescription),
    categoryName: input.categoryName === undefined ? undefined : optionalText(input.categoryName),
    brand: input.brand === undefined ? undefined : optionalText(input.brand),
    purchasePrice: input.purchasePrice === undefined ? undefined : roundMoney(input.purchasePrice),
    sellingPrice: input.sellingPrice === undefined ? undefined : roundMoney(input.sellingPrice),
    vatRate: input.vatRate === undefined ? undefined : roundRate(input.vatRate),
    currency: input.currency === undefined ? undefined : normalizeCurrency(input.currency),
    image: input.image === undefined ? undefined : optionalText(input.image),
    notes: input.notes === undefined ? undefined : optionalText(input.notes)
  };
}

export function normalizeCreateProductCategoryInput(input: CreateProductCategoryInput) {
  return {
    ...input,
    name: input.name.trim(),
    description: optionalText(input.description),
    order: input.order ?? 0,
    active: input.active ?? true
  };
}

export function normalizeUpdateProductCategoryInput(input: UpdateProductCategoryInput) {
  return {
    ...input,
    name: input.name === undefined ? undefined : input.name.trim(),
    description: input.description === undefined ? undefined : optionalText(input.description)
  };
}

export function filterProducts(products: readonly Product[], filters: ProductFilters) {
  const query = normalizeSearchText(filters.query ?? "");

  return products.filter((product) => {
    if (product.workspaceId !== filters.workspaceId) return false;
    if (!filters.includeArchived && product.status === "archived") return false;
    if (filters.status && filters.status !== "all" && product.status !== filters.status) return false;
    if (filters.categoryId && filters.categoryId !== "all" && product.categoryId !== filters.categoryId) return false;
    if (filters.unit && filters.unit !== "all" && product.unit !== filters.unit) return false;
    if (!query) return true;
    return productMatchesQuery(product, query);
  });
}

export function sortProducts(products: readonly Product[], sort: ProductSort) {
  return [...products].sort((first, second) => {
    const direction = sort.direction === "asc" ? 1 : -1;
    const a = productSortValue(first, sort.field);
    const b = productSortValue(second, sort.field);
    if (typeof a === "number" && typeof b === "number") return (a - b) * direction;
    return String(a).localeCompare(String(b), "fr") * direction;
  });
}

export function sortProductCategories(categories: readonly ProductCategory[]) {
  return [...categories].sort((first, second) => first.order - second.order || first.name.localeCompare(second.name, "fr"));
}

export function productMatchesQuery(product: Product, normalizedQuery: string) {
  return [
    product.sku,
    product.barcode,
    product.name,
    product.description,
    product.shortDescription,
    product.categoryName,
    product.brand,
    product.unit,
    product.currency
  ].filter(Boolean).some((value) => normalizeSearchText(String(value)).includes(normalizedQuery));
}

export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function productSortValue(product: Product, field: ProductSort["field"]) {
  if (field === "sellingPrice" || field === "vatRate") return product[field];
  return product[field] ?? "";
}

function optionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function roundRate(value: number) {
  return Math.round(value * 100) / 100;
}
