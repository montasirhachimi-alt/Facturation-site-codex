import "server-only";

import type { Prisma } from "@prisma/client";
import type { Product, ProductCategory, ProductUnit } from "@/modules/products";
import { PRODUCTS_WORKSPACE_ID, validateProductImportRows, type ProductImportRequest, type ProductImportResult, type ProductImportValues } from "@/modules/products";
import { prisma } from "./prisma";
import type { PersistenceTenantScope } from "./tenant-scope";

type DbProduct = Prisma.ProductGetPayload<{ include: { productCategory: true } }>;
type DbProductCategory = Prisma.ProductCategoryGetPayload<Record<string, never>>;

export type ProductCatalogSnapshot = Readonly<{
  products: Product[];
  categories: ProductCategory[];
}>;

export type ProductCatalogPersistenceResource = "product" | "category";

export async function loadProductCatalogSnapshot(scope: PersistenceTenantScope): Promise<ProductCatalogSnapshot> {
  const [categories, products] = await Promise.all([
    prisma.productCategory.findMany({ where: { companyId: scope.companyId }, orderBy: [{ order: "asc" }, { name: "asc" }] }),
    prisma.product.findMany({
      where: { companyId: scope.companyId },
      include: { productCategory: true },
      orderBy: { updatedAt: "desc" }
    })
  ]);

  return {
    categories: categories.map(mapDbProductCategory),
    products: products.map(mapDbProduct)
  };
}

export async function persistProductCatalogRecord(scope: PersistenceTenantScope, resource: ProductCatalogPersistenceResource, record: unknown) {
  if (resource === "product") return persistProduct(scope, record as Product);
  if (resource === "category") return persistProductCategory(scope, record as ProductCategory);
  throw new Error("Ressource catalogue inconnue.");
}

export async function applyProductCatalogImport(scope: PersistenceTenantScope, request: ProductImportRequest): Promise<ProductImportResult> {
  const snapshot = await loadProductCatalogSnapshot(scope);
  const preview = validateProductImportRows(request.rows, request.mapping, {
    existingProducts: snapshot.products,
    categories: snapshot.categories,
    duplicatePolicy: request.duplicatePolicy
  });

  if (preview.invalidRows > 0) {
    return {
      importedCount: 0,
      updatedCount: 0,
      ignoredCount: preview.ignoredRows,
      failedCount: preview.invalidRows,
      preview,
      products: snapshot.products
    };
  }

  const categoryByName = new Map(snapshot.categories.map((category) => [category.name.toLowerCase(), category]));
  const rowsToCreate = preview.rows.filter((row) => row.action === "create");
  const rowsToUpdate = preview.rows.filter((row) => row.action === "update" && row.existingProductId);

  await prisma.$transaction(async (tx) => {
    for (const row of rowsToCreate) {
      await tx.product.create({
        data: {
          companyId: scope.companyId,
          ...importedProductWriteData(row.values, categoryByName)
        }
      });
    }

    for (const row of rowsToUpdate) {
      await tx.product.update({
        where: { id: row.existingProductId! },
        data: importedProductWriteData(row.values, categoryByName)
      });
    }
  });

  const updatedSnapshot = await loadProductCatalogSnapshot(scope);
  return {
    importedCount: rowsToCreate.length,
    updatedCount: rowsToUpdate.length,
    ignoredCount: preview.ignoredRows,
    failedCount: 0,
    preview,
    products: updatedSnapshot.products
  };
}

async function persistProduct(scope: PersistenceTenantScope, product: Product) {
  await assertProductTenant(scope, product.id);
  if (product.categoryId) await assertProductCategoryTenant(scope, product.categoryId);
  await assertSafeTrackingPolicyChange(scope, product);

  await prisma.product.upsert({
    where: { id: product.id },
    update: productWriteData(product),
    create: {
      id: product.id,
      companyId: scope.companyId,
      ...productWriteData(product)
    }
  });
  return product;
}

async function assertSafeTrackingPolicyChange(scope: PersistenceTenantScope, product: Product) {
  if (product.flags.trackInventory) return;
  const existing = await prisma.product.findUnique({ where: { id: product.id }, select: { companyId: true, trackInventory: true } });
  if (!existing || existing.companyId !== scope.companyId || !existing.trackInventory) return;
  const [balanceCount, movementCount] = await Promise.all([
    prisma.inventoryBalance.count({ where: { companyId: scope.companyId, productId: product.id } }),
    prisma.inventoryStockMovement.count({ where: { companyId: scope.companyId, productId: product.id } })
  ]);
  if (balanceCount > 0 || movementCount > 0) {
    throw new Error("Ce produit a déjà un historique ou un solde de stock. Il ne peut pas être transformé en service non stocké.");
  }
}

async function persistProductCategory(scope: PersistenceTenantScope, category: ProductCategory) {
  await assertProductCategoryTenant(scope, category.id);
  if (category.parentId) await assertProductCategoryTenant(scope, category.parentId);

  await prisma.productCategory.upsert({
    where: { id: category.id },
    update: categoryWriteData(category),
    create: {
      id: category.id,
      companyId: scope.companyId,
      ...categoryWriteData(category)
    }
  });
  return category;
}

async function assertProductTenant(scope: PersistenceTenantScope, id: string) {
  const existing = await prisma.product.findUnique({ where: { id }, select: { companyId: true } });
  assertTenantOwner(scope, existing?.companyId);
}

async function assertProductCategoryTenant(scope: PersistenceTenantScope, id: string) {
  const existing = await prisma.productCategory.findUnique({ where: { id }, select: { companyId: true } });
  assertTenantOwner(scope, existing?.companyId);
}

function assertTenantOwner(scope: PersistenceTenantScope, companyId?: string) {
  if (companyId && companyId !== scope.companyId) {
    throw new Error("Accès refusé: cet enregistrement produit appartient à une autre entreprise.");
  }
}

function productWriteData(product: Product) {
  return {
    productCategoryId: product.categoryId ?? null,
    sku: product.sku,
    barcode: product.barcode ?? null,
    reference: product.sku,
    name: product.name,
    designation: product.name,
    shortDescription: product.shortDescription ?? null,
    description: product.description ?? null,
    brand: product.brand ?? null,
    unit: product.unit,
    imageUrl: product.image ?? null,
    purchasePrice: product.purchasePrice,
    sellingPrice: product.sellingPrice,
    salePrice: product.sellingPrice,
    vatRate: product.vatRate,
    currency: product.currency,
    active: product.active,
    status: product.status,
    notes: product.notes ?? null,
    trackInventory: product.flags.trackInventory,
    allowNegativeStock: product.flags.allowNegativeStock,
    hasVariants: product.flags.hasVariants,
    serialTracked: product.flags.serialTracked,
    batchTracked: product.flags.batchTracked,
    createdAt: parseDate(product.createdAt),
    updatedAt: parseDate(product.updatedAt)
  };
}

function importedProductWriteData(values: ProductImportValues, categoryByName: ReadonlyMap<string, ProductCategory>) {
  const category = values.categoryId ? undefined : values.category ? categoryByName.get(values.category.toLowerCase()) : undefined;
  const productCategoryId = values.categoryId ?? category?.id ?? null;

  return {
    productCategoryId,
    sku: values.sku,
    barcode: values.barcode ?? null,
    reference: values.sku,
    name: values.name,
    designation: values.name,
    shortDescription: values.shortDescription ?? null,
    description: values.description ?? null,
    brand: values.brand ?? null,
    unit: values.unit,
    purchasePrice: values.purchasePrice,
    sellingPrice: values.sellingPrice,
    salePrice: values.sellingPrice,
    vatRate: values.vatRate,
    currency: values.currency,
    active: values.active,
    status: values.active ? "active" : "archived",
    notes: values.notes ?? null
  };
}

function categoryWriteData(category: ProductCategory) {
  return {
    name: category.name,
    parentId: category.parentId ?? null,
    description: category.description ?? null,
    order: category.order,
    active: category.active,
    createdAt: parseDate(category.createdAt),
    updatedAt: parseDate(category.updatedAt)
  };
}

function mapDbProduct(row: DbProduct): Product {
  return {
    id: row.id,
    workspaceId: PRODUCTS_WORKSPACE_ID,
    sku: row.sku,
    barcode: row.barcode ?? undefined,
    name: row.name,
    description: row.description ?? undefined,
    shortDescription: row.shortDescription ?? undefined,
    categoryId: row.productCategoryId ?? undefined,
    categoryName: row.productCategory?.name,
    brand: row.brand ?? undefined,
    unit: row.unit as ProductUnit,
    purchasePrice: decimalToNumber(row.purchasePrice),
    sellingPrice: decimalToNumber(row.sellingPrice),
    vatRate: decimalToNumber(row.vatRate),
    currency: row.currency,
    active: row.active,
    image: row.imageUrl ?? undefined,
    notes: row.notes ?? undefined,
    status: row.status === "archived" ? "archived" : "active",
    flags: {
      trackInventory: row.trackInventory,
      allowNegativeStock: row.allowNegativeStock,
      hasVariants: row.hasVariants,
      serialTracked: row.serialTracked,
      batchTracked: row.batchTracked
    },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  } as Product;
}

function mapDbProductCategory(row: DbProductCategory): ProductCategory {
  return {
    id: row.id,
    workspaceId: PRODUCTS_WORKSPACE_ID,
    name: row.name,
    parentId: row.parentId ?? undefined,
    description: row.description ?? undefined,
    order: row.order,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  } as ProductCategory;
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function decimalToNumber(value: Prisma.Decimal | number) {
  return typeof value === "number" ? value : value.toNumber();
}
