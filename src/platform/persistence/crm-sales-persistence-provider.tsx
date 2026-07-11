"use client";

import { useEffect } from "react";
import { hydrateCrmSalesPersistence } from "./crm-sales-persistence.client";

export function CrmSalesPersistenceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void hydrateCrmSalesPersistence();
  }, []);

  return children;
}
