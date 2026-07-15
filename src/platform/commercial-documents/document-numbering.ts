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
    "sales-order": "SO",
    "delivery-note": "BL",
    "purchase-order": "PO",
    "goods-receipt": "GR",
    "supplier-invoice": "FA"
  };

  return prefixes[type] ?? "DOC";
}
