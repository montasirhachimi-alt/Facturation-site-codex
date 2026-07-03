import type { QuoteSort, QuoteStatus } from "./quote.types";

export const QUOTE_STATUSES = Object.freeze(["draft", "sent", "accepted", "refused", "expired"] as const);

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = Object.freeze({
  draft: "Brouillon",
  sent: "Envoyé",
  accepted: "Accepté",
  refused: "Refusé",
  expired: "Expiré"
});

export const DEFAULT_QUOTE_SORT: QuoteSort = Object.freeze({
  field: "issueDate",
  direction: "desc"
});

export const DEFAULT_QUOTE_VALIDITY_DAYS = 30;
