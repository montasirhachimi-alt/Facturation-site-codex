import type { QuoteItem } from "@/modules/sales/quotes/quote.types";

export type SalesLineItemDraft = QuoteItem;

export type SalesLineItemValidation = Readonly<{
  valid: boolean;
  errors: readonly string[];
}>;
