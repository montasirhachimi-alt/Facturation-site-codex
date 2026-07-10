"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { KeyboardShortcutsHelp } from "./keyboard-shortcuts-help";
import { shouldIgnoreKeyboardEvent } from "./keyboard-shortcut.utils";

export function KeyboardShortcutProvider({ children }: { children: ReactNode }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const closeHelp = useCallback(() => setHelpOpen(false), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "?") return;
      if (shouldIgnoreKeyboardEvent(event)) return;
      event.preventDefault();
      setHelpOpen(true);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      {children}
      <KeyboardShortcutsHelp open={helpOpen} onClose={closeHelp} />
    </>
  );
}

