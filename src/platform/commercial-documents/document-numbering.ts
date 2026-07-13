export type DocumentNumberingInput = Readonly<{
  prefix: string;
  sequence: number;
  year?: number;
  padding?: number;
}>;

export function formatCommercialDocumentNumber(input: DocumentNumberingInput) {
  const year = input.year ?? new Date().getFullYear();
  const padding = input.padding ?? 3;
  return `${input.prefix}-${year}-${String(input.sequence).padStart(padding, "0")}`;
}

export function getDocumentNumberPrefix(type: string) {
  const prefixes: Record<string, string> = {
    quote: "DEV",
    invoice: "FAC",
    "sales-order": "BC",
    "delivery-note": "BL",
    "purchase-order": "BCA",
    "goods-receipt": "BR",
    "supplier-invoice": "FA"
  };

  return prefixes[type] ?? "DOC";
}
