"use client";

import { useEffect } from "react";
import { hydrateShipmentPersistence } from "./shipment-persistence.client";

export function ShipmentPersistenceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void hydrateShipmentPersistence();
  }, []);

  return children;
}
