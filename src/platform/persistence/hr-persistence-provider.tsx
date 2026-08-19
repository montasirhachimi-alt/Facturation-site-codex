"use client";

import { useEffect } from "react";
import { hydrateHrPersistence } from "./hr-persistence.client";

export function HrPersistenceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void hydrateHrPersistence();
  }, []);

  return children;
}
