import type {
  CommercialDocumentDiscount,
  CommercialDocumentLine,
  CommercialDocumentLineSummary,
  CommercialDocumentTotals
} from "./document.types";

export function roundDocumentAmount(value: number, precision = 2) {
  const factor = 10 ** precision;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

export function calculateDiscountAmount(base: number, discount?: CommercialDocumentDiscount) {
  if (!discount) return 0;
  const amountDiscount = discount.amount ?? 0;
  const rateDiscount = base * ((discount.rate ?? 0) / 100);
  return roundDocumentAmount(Math.min(base, amountDiscount + rateDiscount));
}

export function calculateDocumentLine(line: CommercialDocumentLine): CommercialDocumentLineSummary {
  const subtotal = roundDocumentAmount(line.quantity * line.unitPrice);
  const discount = calculateDiscountAmount(subtotal, line.discount);
  const taxable = roundDocumentAmount(Math.max(0, subtotal - discount));
  const tax = roundDocumentAmount(line.tax?.amount ?? taxable * ((line.tax?.rate ?? 0) / 100));

  return Object.freeze({
    lineId: line.id,
    subtotal,
    discount,
    taxable,
    tax,
    total: roundDocumentAmount(taxable + tax)
  });
}

export function calculateDocumentTotals(
  lines: readonly CommercialDocumentLine[],
  currency: string,
  documentDiscount?: CommercialDocumentDiscount
): CommercialDocumentTotals {
  const lineSummaries = lines.map(calculateDocumentLine);
  const linesSubtotal = roundDocumentAmount(lineSummaries.reduce((total, line) => total + line.subtotal, 0));
  const lineDiscount = roundDocumentAmount(lineSummaries.reduce((total, line) => total + line.discount, 0));
  const additionalDiscount = calculateDiscountAmount(Math.max(0, linesSubtotal - lineDiscount), documentDiscount);
  const discount = roundDocumentAmount(lineDiscount + additionalDiscount);
  const taxableBeforeDocumentDiscount = roundDocumentAmount(lineSummaries.reduce((total, line) => total + line.taxable, 0));
  const discountRatio = taxableBeforeDocumentDiscount > 0 ? additionalDiscount / taxableBeforeDocumentDiscount : 0;
  const tax = roundDocumentAmount(
    lineSummaries.reduce((total, line) => total + line.tax * (1 - discountRatio), 0)
  );
  const taxable = roundDocumentAmount(Math.max(0, linesSubtotal - discount));

  return Object.freeze({
    subtotal: linesSubtotal,
    discount,
    taxable,
    tax,
    total: roundDocumentAmount(taxable + tax),
    currency,
    lines: Object.freeze(lineSummaries)
  });
}
