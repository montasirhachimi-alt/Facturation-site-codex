import { DEFAULT_QUOTE_SORT } from "./quote.constants";
import type { CreateQuoteInput, Quote, QuoteFilters, QuoteId, QuoteListResult, QuoteSort, WorkspaceId } from "./quote.types";
import { addDays, matchesQuoteSearch, sortQuotes } from "./quote.utils";

export class QuoteService {
  private readonly quotes = new Map<QuoteId, Quote>();

  constructor(options: { seed?: readonly Quote[] } = {}) {
    for (const quote of options.seed ?? []) {
      this.quotes.set(quote.id, freezeQuote(quote));
    }
  }

  listQuotes(filters: QuoteFilters, sort: QuoteSort = DEFAULT_QUOTE_SORT): QuoteListResult {
    const quotes = [...this.quotes.values()]
      .filter((quote) => quote.workspaceId === filters.workspaceId)
      .filter((quote) => !filters.query || matchesQuoteSearch(quote, filters.query))
      .filter((quote) => !filters.status || filters.status === "all" || quote.status === filters.status)
      .filter((quote) => !filters.companyId || filters.companyId === "all" || quote.companyId === filters.companyId)
      .filter((quote) => !filters.opportunityId || filters.opportunityId === "all" || quote.opportunityId === filters.opportunityId);

    const sorted = sortQuotes(quotes, sort);
    return Object.freeze({ quotes: sorted, total: sorted.length });
  }

  getQuote(id: QuoteId, workspaceId: WorkspaceId) {
    const quote = this.quotes.get(id);
    return quote?.workspaceId === workspaceId ? quote : undefined;
  }

  createQuote(input: CreateQuoteInput) {
    const now = "2026-07-03T10:00:00.000Z";
    const quote = freezeQuote({
      id: `quote-${Date.now()}` as QuoteId,
      workspaceId: input.workspaceId,
      number: `DEV-2026-${String(this.quotes.size + 1).padStart(3, "0")}`,
      customerName: input.customerName.trim(),
      companyId: input.companyId,
      contactId: input.contactId,
      opportunityId: input.opportunityId,
      status: "draft",
      issueDate: now,
      expirationDate: addDays(now, input.validityDays),
      currency: input.currency,
      items: input.items,
      discountRate: input.discountRate ?? 0,
      notes: input.notes?.trim(),
      ownerId: input.ownerId,
      createdAt: now,
      updatedAt: now
    });

    this.quotes.set(quote.id, quote);
    return quote;
  }
}

export function freezeQuote(quote: Quote): Quote {
  return Object.freeze({
    ...quote,
    items: Object.freeze(quote.items.map((item) => Object.freeze({ ...item })))
  });
}
