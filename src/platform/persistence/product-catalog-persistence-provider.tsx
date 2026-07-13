"use client";

import { useEffect } from "react";
import { hydrateProductCatalogPersistence } from "./product-catalog-persistence.client";

export function ProductCatalogPersistenceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void hydrateProductCatalogPersistence();
  }, []);

  return children;
}
