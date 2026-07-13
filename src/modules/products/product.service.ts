import { DEFAULT_PRODUCT_FLAGS, DEFAULT_PRODUCT_SORT } from "./product.constants";
import type {
  CreateProductCategoryInput,
  CreateProductInput,
  Product,
  ProductCategory,
  ProductCategoryId,
  ProductCategoryListResult,
  ProductFilters,
  ProductId,
  ProductListResult,
  ProductSort,
  UpdateProductCategoryInput,
  UpdateProductInput,
  WorkspaceId
} from "./product.types";
import {
  filterProducts,
  normalizeBarcode,
  normalizeCreateProductCategoryInput,
  normalizeCreateProductInput,
  normalizeSku,
  normalizeUpdateProductCategoryInput,
  normalizeUpdateProductInput,
  sortProductCategories,
  sortProducts
} from "./product.utils";
import {
  validateCreateProductCategoryInput,
  validateCreateProductInput,
  validateUpdateProductCategoryInput,
  validateUpdateProductInput,
  type ProductValidationIssue,
  type ProductValidationResult
} from "./product.validation";

export type ProductServiceOptions = Readonly<{
  seed?: readonly Product[];
  categories?: readonly ProductCategory[];
  now?: () => string;
  createProductId?: () => ProductId;
  createCategoryId?: () => ProductCategoryId;
}>;

export class ProductService {
  private readonly products = new Map<ProductId, Product>();
  private readonly categories = new Map<ProductCategoryId, ProductCategory>();
  private readonly now: () => string;
  private readonly createProductId: () => ProductId;
  private readonly createCategoryId: () => ProductCategoryId;

  constructor(options: ProductServiceOptions = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.createProductId = options.createProductId ?? (() => `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` as ProductId);
    this.createCategoryId = options.createCategoryId ?? (() => `pcat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` as ProductCategoryId);

    for (const category of options.categories ?? []) {
      this.categories.set(category.id, freezeProductCategory(category));
    }

    for (const product of options.seed ?? []) {
      this.products.set(product.id, freezeProduct(product));
    }
  }

  replaceProducts(products: readonly Product[]) {
    this.products.clear();
    products.forEach((product) => this.products.set(product.id, freezeProduct(product)));
  }

  replaceCategories(categories: readonly ProductCategory[]) {
    this.categories.clear();
    categories.forEach((category) => this.categories.set(category.id, freezeProductCategory(category)));
  }

  upsertProduct(product: Product) {
    const frozen = freezeProduct(product);
    this.products.set(frozen.id, frozen);
    return frozen;
  }

  upsertCategory(category: ProductCategory) {
    const frozen = freezeProductCategory(category);
    this.categories.set(frozen.id, frozen);
    return frozen;
  }

  listProducts(filters: ProductFilters, sort: ProductSort = DEFAULT_PRODUCT_SORT): ProductListResult {
    if (filters.permission && !filters.permission.allowed) return createProductListResult([], 0, filters.workspaceId);

    const workspaceProducts = [...this.products.values()].filter((product) => product.workspaceId === filters.workspaceId);
    const filtered = filterProducts(workspaceProducts, filters);
    return createProductListResult(sortProducts(filtered, sort), workspaceProducts.length, filters.workspaceId);
  }

  listCategories(workspaceId: WorkspaceId): ProductCategoryListResult {
    const categories = sortProductCategories([...this.categories.values()].filter((category) => category.workspaceId === workspaceId));
    return Object.freeze({ categories: Object.freeze(categories), total: categories.length, workspaceId });
  }

  getProduct(id: ProductId, workspaceId: WorkspaceId) {
    const product = this.products.get(id);
    return product?.workspaceId === workspaceId ? product : undefined;
  }

  lookupBySku(sku: string, workspaceId: WorkspaceId) {
    const normalizedSku = normalizeSku(sku);
    return [...this.products.values()].find((product) => product.workspaceId === workspaceId && product.sku === normalizedSku);
  }

  lookupByBarcode(barcode: string, workspaceId: WorkspaceId) {
    const normalizedBarcode = normalizeBarcode(barcode);
    if (!normalizedBarcode) return undefined;
    return [...this.products.values()].find((product) => product.workspaceId === workspaceId && product.barcode === normalizedBarcode);
  }

  createProduct(input: CreateProductInput) {
    const validation = this.validateUniqueProduct(validateCreateProductInput(input), input.workspaceId, input.sku, input.barcode);
    if (!validation.valid) return Object.freeze({ product: undefined, validation });

    const normalized = normalizeCreateProductInput(input);
    const timestamp = this.now();
    const category = normalized.categoryId ? this.categories.get(normalized.categoryId) : undefined;
    const product = freezeProduct({
      id: this.createProductId(),
      workspaceId: normalized.workspaceId,
      sku: normalized.sku,
      barcode: normalized.barcode,
      name: normalized.name,
      description: normalized.description,
      shortDescription: normalized.shortDescription,
      categoryId: normalized.categoryId,
      categoryName: category?.name ?? normalized.categoryName,
      brand: normalized.brand,
      unit: normalized.unit,
      purchasePrice: normalized.purchasePrice,
      sellingPrice: normalized.sellingPrice,
      vatRate: normalized.vatRate,
      currency: normalized.currency,
      active: true,
      image: normalized.image,
      notes: normalized.notes,
      status: "active",
      flags: normalized.flags,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: normalized.createdBy
    });

    this.products.set(product.id, product);
    return Object.freeze({ product, validation });
  }

  updateProduct(input: UpdateProductInput) {
    const validation = this.validateUniqueProduct(validateUpdateProductInput(input), input.workspaceId, input.sku, input.barcode, input.id);
    if (!validation.valid) return Object.freeze({ product: undefined, validation });

    const existing = this.getProduct(input.id, input.workspaceId);
    if (!existing) return Object.freeze({ product: undefined, validation });

    const normalized = normalizeUpdateProductInput(input);
    const category = normalized.categoryId ? this.categories.get(normalized.categoryId) : undefined;
    const product = freezeProduct({
      ...existing,
      sku: normalized.sku ?? existing.sku,
      barcode: normalized.barcode ?? existing.barcode,
      name: normalized.name ?? existing.name,
      description: normalized.description ?? existing.description,
      shortDescription: normalized.shortDescription ?? existing.shortDescription,
      categoryId: normalized.categoryId ?? existing.categoryId,
      categoryName: category?.name ?? normalized.categoryName ?? existing.categoryName,
      brand: normalized.brand ?? existing.brand,
      unit: normalized.unit ?? existing.unit,
      purchasePrice: normalized.purchasePrice ?? existing.purchasePrice,
      sellingPrice: normalized.sellingPrice ?? existing.sellingPrice,
      vatRate: normalized.vatRate ?? existing.vatRate,
      currency: normalized.currency ?? existing.currency,
      active: normalized.active ?? existing.active,
      image: normalized.image ?? existing.image,
      notes: normalized.notes ?? existing.notes,
      status: normalized.status ?? existing.status,
      flags: { ...existing.flags, ...(normalized.flags ?? {}) },
      updatedAt: this.now(),
      updatedBy: normalized.updatedBy
    });

    this.products.set(product.id, product);
    return Object.freeze({ product, validation });
  }

  archiveProduct(id: ProductId, workspaceId: WorkspaceId, updatedBy?: UpdateProductInput["updatedBy"]) {
    return this.updateProduct({ id, workspaceId, active: false, status: "archived", updatedBy });
  }

  restoreProduct(id: ProductId, workspaceId: WorkspaceId, updatedBy?: UpdateProductInput["updatedBy"]) {
    return this.updateProduct({ id, workspaceId, active: true, status: "active", updatedBy });
  }

  createCategory(input: CreateProductCategoryInput) {
    const validation = validateCreateProductCategoryInput(input);
    if (!validation.valid) return Object.freeze({ category: undefined, validation });

    const normalized = normalizeCreateProductCategoryInput(input);
    if (this.categoryNameExists(normalized.workspaceId, normalized.name)) {
      return Object.freeze({ category: undefined, validation: duplicateCategoryValidation() });
    }

    const timestamp = this.now();
    const category = freezeProductCategory({
      id: this.createCategoryId(),
      workspaceId: normalized.workspaceId,
      name: normalized.name,
      parentId: normalized.parentId,
      description: normalized.description,
      order: normalized.order,
      active: normalized.active,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    this.categories.set(category.id, category);
    return Object.freeze({ category, validation });
  }

  updateCategory(input: UpdateProductCategoryInput) {
    const validation = validateUpdateProductCategoryInput(input);
    if (!validation.valid) return Object.freeze({ category: undefined, validation });

    const existing = this.categories.get(input.id);
    if (!existing || existing.workspaceId !== input.workspaceId) return Object.freeze({ category: undefined, validation });

    const normalized = normalizeUpdateProductCategoryInput(input);
    if (normalized.name && this.categoryNameExists(normalized.workspaceId, normalized.name, input.id)) {
      return Object.freeze({ category: undefined, validation: duplicateCategoryValidation() });
    }

    const category = freezeProductCategory({
      ...existing,
      name: normalized.name ?? existing.name,
      parentId: normalized.parentId ?? existing.parentId,
      description: normalized.description ?? existing.description,
      order: normalized.order ?? existing.order,
      active: normalized.active ?? existing.active,
      updatedAt: this.now()
    });
    this.categories.set(category.id, category);
    return Object.freeze({ category, validation });
  }

  private validateUniqueProduct(validation: ProductValidationResult, workspaceId: WorkspaceId, sku?: string, barcode?: string, ignoredId?: ProductId): ProductValidationResult {
    const issues = [...validation.issues];
    const normalizedSku = sku ? normalizeSku(sku) : "";
    const normalizedBarcode = normalizeBarcode(barcode);

    if (normalizedSku && [...this.products.values()].some((product) => product.workspaceId === workspaceId && product.id !== ignoredId && product.sku === normalizedSku)) {
      issues.push({ code: "duplicate_sku", field: "sku", message: "Ce SKU existe déjà." });
    }

    if (normalizedBarcode && [...this.products.values()].some((product) => product.workspaceId === workspaceId && product.id !== ignoredId && product.barcode === normalizedBarcode)) {
      issues.push({ code: "duplicate_barcode", field: "barcode", message: "Ce code-barres existe déjà." });
    }

    return Object.freeze({ valid: issues.length === 0, issues: Object.freeze(issues) });
  }

  private categoryNameExists(workspaceId: WorkspaceId, name: string, ignoredId?: ProductCategoryId) {
    return [...this.categories.values()].some((category) =>
      category.workspaceId === workspaceId && category.id !== ignoredId && category.name.toLowerCase() === name.toLowerCase()
    );
  }
}

export function freezeProduct(product: Product): Product {
  return Object.freeze({
    ...product,
    flags: Object.freeze({ ...DEFAULT_PRODUCT_FLAGS, ...product.flags })
  });
}

export function freezeProductCategory(category: ProductCategory): ProductCategory {
  return Object.freeze({ ...category });
}

function createProductListResult(products: readonly Product[], total: number, workspaceId: WorkspaceId): ProductListResult {
  return Object.freeze({
    products: Object.freeze([...products]),
    total,
    filtered: products.length,
    workspaceId
  });
}

function duplicateCategoryValidation(): ProductValidationResult {
  const issue: ProductValidationIssue = { code: "duplicate_category", field: "name", message: "Cette catégorie existe déjà." };
  return Object.freeze({
    valid: false,
    issues: Object.freeze([issue])
  });
}

export const productService = new ProductService();
