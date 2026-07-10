import { QuoteService } from "./quote.service";
import { quoteSeed } from "./quotes.seed";

export const quoteStoreEventName = "hicopilot-quotes-updated";
export const quoteService = new QuoteService({ seed: quoteSeed });

export function notifyQuoteStoreUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(quoteStoreEventName));
}

export function subscribeToQuoteStore(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(quoteStoreEventName, listener);
  return () => window.removeEventListener(quoteStoreEventName, listener);
}
