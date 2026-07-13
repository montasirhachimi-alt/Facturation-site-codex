"use client";

import { useEffect } from "react";
import { hydrateInventoryPersistence } from "./inventory-persistence.client";

export function InventoryPersistenceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void hydrateInventoryPersistence();
  }, []);

  return children;
}
