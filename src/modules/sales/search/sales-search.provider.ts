import type { SearchProvider } from "@/runtime/search";

function createSalesSearchProvider(moduleId: SearchProvider["moduleId"], label: string): SearchProvider {
  return Object.freeze({
    moduleId,
    label,
    search: async () => Object.freeze([])
  });
}

export const salesSearchProviders: readonly SearchProvider[] = Object.freeze([
  createSalesSearchProvider("sales.quotes", "Sales Quotes Search Provider"),
  createSalesSearchProvider("sales.invoices", "Sales Invoices Search Provider"),
  createSalesSearchProvider("sales.payments", "Sales Payments Search Provider")
]);

export const salesSearchProvider = salesSearchProviders[0];
