import { PackageCheck } from "lucide-react";
import type { StockProduct } from "@/lib/types";
import type { EntityPickerItem } from "@/ui/forms/entity-picker.types";
import type { SalesLineItemDraft, SalesLineItemValidation } from "./sales-line-item.types";

export function createEmptySalesLineItem(prefix = "line"): SalesLineItemDraft {
  return {
    id: `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    description: "",
    quantity: 1,
    unitPrice: 0,
    taxRate: 20
  };
}

export function createSalesLineItemFromProduct(product: StockProduct, prefix = "line"): SalesLineItemDraft {
  return {
    id: `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    description: product.designation,
    quantity: 1,
    unitPrice: product.salePrice,
    taxRate: product.vat
  };
}

export function getSalesLineSubtotal(line: SalesLineItemDraft) {
  return roundMoney(line.quantity * line.unitPrice);
}

export function getSalesLineTax(line: SalesLineItemDraft) {
  return roundMoney(getSalesLineSubtotal(line) * (line.taxRate / 100));
}

export function getSalesLineTotal(line: SalesLineItemDraft) {
  return roundMoney(getSalesLineSubtotal(line) + getSalesLineTax(line));
}

export function validateSalesLineItems(lines: readonly SalesLineItemDraft[]): SalesLineItemValidation {
  const errors: string[] = [];
  const validLines = lines.filter((line) => line.description.trim() && line.quantity > 0 && line.unitPrice >= 0);

  if (validLines.length === 0) {
    errors.push("Ajoutez au moins une ligne valide.");
  }

  lines.forEach((line, index) => {
    const label = `Ligne ${index + 1}`;
    if (!line.description.trim()) errors.push(`${label} : description obligatoire.`);
    if (line.quantity <= 0) errors.push(`${label} : quantité supérieure à zéro obligatoire.`);
    if (line.unitPrice < 0) errors.push(`${label} : prix unitaire négatif impossible.`);
    if (line.taxRate < 0) errors.push(`${label} : TVA négative impossible.`);
  });

  return Object.freeze({ valid: errors.length === 0, errors });
}

export function normalizeSalesLineItems(lines: readonly SalesLineItemDraft[]) {
  return lines
    .map((line) => ({
      id: line.id,
      description: line.description.trim(),
      quantity: Number(line.quantity),
      unitPrice: roundMoney(Number(line.unitPrice)),
      taxRate: Number(line.taxRate)
    }))
    .filter((line) => line.description && line.quantity > 0 && line.unitPrice >= 0);
}

export function productToSalesPickerItem(product: StockProduct): EntityPickerItem {
  return {
    id: product.id,
    title: product.designation,
    type: "product",
    typeLabel: "Produit",
    metadata: `${product.reference} · ${product.category} · ${product.salePrice} HT · TVA ${product.vat}%`,
    icon: PackageCheck,
    keywords: [product.reference, product.designation, product.description, product.category, product.unit].filter(Boolean)
  };
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
