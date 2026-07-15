import { PackageCheck } from "lucide-react";
import { calculateDocumentLine, roundDocumentAmount, validateDocumentLine } from "@/platform/commercial-documents";
import type { Product } from "@/modules/products";
import type { EntityPickerItem } from "@/ui/forms/entity-picker.types";
import type { SalesLineItemDraft, SalesLineItemValidation } from "./sales-line-item.types";

export function createEmptySalesLineItem(prefix = "line"): SalesLineItemDraft {
  return {
    id: `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    description: "",
    quantity: 1,
    unit: "piece",
    unitPrice: 0,
    taxRate: 20
  };
}

export function createSalesLineItemFromProduct(product: Product, prefix = "line"): SalesLineItemDraft {
  return {
    id: `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    productId: product.id,
    productSku: product.sku,
    productName: product.name,
    description: product.name,
    quantity: 1,
    unit: product.unit,
    unitPrice: product.sellingPrice,
    taxRate: product.vatRate
  };
}

export function getSalesLineSubtotal(line: SalesLineItemDraft) {
  return calculateDocumentLine(toDocumentLine(line)).subtotal;
}

export function getSalesLineTax(line: SalesLineItemDraft) {
  return calculateDocumentLine(toDocumentLine(line)).tax;
}

export function getSalesLineTotal(line: SalesLineItemDraft) {
  return calculateDocumentLine(toDocumentLine(line)).total;
}

export function validateSalesLineItems(lines: readonly SalesLineItemDraft[]): SalesLineItemValidation {
  const errors: string[] = [];
  const validLines = lines.filter((line) => line.description.trim() && line.quantity > 0 && line.unitPrice >= 0);

  if (validLines.length === 0) {
    errors.push("Ajoutez au moins une ligne valide.");
  }

  lines.forEach((line, index) => {
    const label = `Ligne ${index + 1}`;
    const lineIssues = validateDocumentLine(toDocumentLine(line), index);
    if (lineIssues.some((issue) => issue.code === "line.description.required")) errors.push(`${label} : description obligatoire.`);
    if (lineIssues.some((issue) => issue.code === "line.quantity.invalid")) errors.push(`${label} : quantité supérieure à zéro obligatoire.`);
    if (lineIssues.some((issue) => issue.code === "line.unitPrice.invalid")) errors.push(`${label} : prix unitaire négatif impossible.`);
    if (lineIssues.some((issue) => issue.code === "line.tax.invalid")) errors.push(`${label} : TVA négative impossible.`);
  });

  return Object.freeze({ valid: errors.length === 0, errors });
}

export function normalizeSalesLineItems(lines: readonly SalesLineItemDraft[]) {
  return lines
    .map((line) => ({
      id: line.id,
      productId: line.productId,
      productSku: line.productSku,
      productName: line.productName,
      description: line.description.trim(),
      quantity: Number(line.quantity),
      unit: line.unit,
      unitPrice: roundDocumentAmount(Number(line.unitPrice)),
      taxRate: Number(line.taxRate)
    }))
    .filter((line) => line.description && line.quantity > 0 && line.unitPrice >= 0);
}

export function productToSalesPickerItem(product: Product): EntityPickerItem {
  return {
    id: product.id,
    title: product.name,
    type: "product",
    typeLabel: "Produit",
    metadata: `${product.sku} · ${product.categoryName ?? "Catalogue"} · ${product.sellingPrice} HT · TVA ${product.vatRate}%`,
    icon: PackageCheck,
    keywords: [product.sku, product.name, product.description, product.categoryName, product.unit].filter((value): value is string => Boolean(value))
  };
}

function toDocumentLine(line: SalesLineItemDraft) {
  return {
    id: line.id,
    description: line.description,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    tax: { rate: line.taxRate }
  };
}
