import type { PdfLayoutDocument } from "@/components/pdf-templates/PdfLayout";

export type SalesDocumentPdfKind = "quote" | "invoice";
export type SalesDocumentPdfMode = "save" | "print";

export type SalesDocumentPdfPayload = Readonly<{
  kind: SalesDocumentPdfKind;
  document: PdfLayoutDocument;
}>;

