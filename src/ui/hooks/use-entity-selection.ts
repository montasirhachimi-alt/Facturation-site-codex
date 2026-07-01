"use client";

import { useCallback, useState } from "react";

export function useEntitySelection<TId extends string>() {
  const [selectedIds, setSelectedIds] = useState<readonly TId[]>([]);

  const toggleRow = useCallback((id: TId) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }, []);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  return { clearSelection, selectedIds, setSelectedIds, toggleRow };
}

