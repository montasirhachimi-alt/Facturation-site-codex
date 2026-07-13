import { PackageCheck } from "lucide-react";
import type { StockProduct } from "@/lib/types";
import { calculateDocumentLine, roundDocumentAmount, validateDocumentLine } from "@/platform/commercial-documents";
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
      description: line.description.trim(),
      quantity: Number(line.quantity),
      unitPrice: roundDocumentAmount(Number(line.unitPrice)),
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

function toDocumentLine(line: SalesLineItemDraft) {
  return {
    id: line.id,
    description: line.description,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    tax: { rate: line.taxRate }
  };
}
