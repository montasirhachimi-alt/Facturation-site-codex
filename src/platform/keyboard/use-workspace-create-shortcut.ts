"use client";

import { useCallback } from "react";
import { useKeyboardShortcut } from "./use-keyboard-shortcut";

export function useWorkspaceCreateShortcut({
  enabled = true,
  label,
  onCreate
}: {
  enabled?: boolean;
  label: string;
  onCreate: () => void;
}) {
  const handler = useCallback(() => {
    onCreate();
  }, [onCreate]);

  useKeyboardShortcut({
    id: `workspace-create-${label}`,
    key: "n",
    modifiers: ["meta", "ctrl"],
    label,
    description: "Créer dans l'espace de travail actif.",
    category: "Global",
    scope: "workspace",
    enabled,
    preventDefault: true,
    handler
  });
}

