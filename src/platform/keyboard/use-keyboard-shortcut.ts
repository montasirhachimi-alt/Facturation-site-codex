"use client";

import { useEffect } from "react";
import type { KeyboardShortcutDefinition } from "./keyboard-shortcut.types";
import { matchesShortcut, shouldIgnoreKeyboardEvent } from "./keyboard-shortcut.utils";

export function useKeyboardShortcut(shortcut: KeyboardShortcutDefinition) {
  useEffect(() => {
    if (shortcut.enabled === false) return undefined;

    function onKeyDown(event: KeyboardEvent) {
      if (!matchesShortcut(event, shortcut)) return;
      if (shouldIgnoreKeyboardEvent(event, shortcut.allowInEditable)) return;
      if (event.repeat) return;
      if (shortcut.preventDefault !== false) event.preventDefault();
      shortcut.handler(event);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcut]);
}

