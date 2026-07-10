import type { KeyboardShortcutDefinition, KeyboardShortcutDisplay } from "./keyboard-shortcut.types";

const editableSelector = [
  "input",
  "textarea",
  "select",
  "[contenteditable='true']",
  "[contenteditable='']",
  "[role='textbox']",
  "[data-keyboard-editable='true']"
].join(",");

export function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(editableSelector));
}

export function shouldIgnoreKeyboardEvent(event: KeyboardEvent, allowInEditable = false) {
  if (event.defaultPrevented) return true;
  if (event.isComposing) return true;
  if (allowInEditable) return false;
  return isEditableTarget(event.target);
}

export function isModKey(event: KeyboardEvent) {
  return event.metaKey || event.ctrlKey;
}

export function matchesShortcut(event: KeyboardEvent, shortcut: Pick<KeyboardShortcutDefinition, "key" | "modifiers">) {
  const keyMatches = normalizeKey(event.key) === normalizeKey(shortcut.key);
  if (!keyMatches) return false;

  const modifiers = new Set(shortcut.modifiers ?? []);
  const wantsMeta = modifiers.has("meta");
  const wantsCtrl = modifiers.has("ctrl");
  const wantsShift = modifiers.has("shift");
  const wantsAlt = modifiers.has("alt");
  const platformModifierSatisfied = wantsMeta || wantsCtrl ? event.metaKey || event.ctrlKey : !event.metaKey && !event.ctrlKey;

  return platformModifierSatisfied && event.shiftKey === wantsShift && event.altKey === wantsAlt;
}

export function normalizeKey(key: string) {
  if (key === " ") return "space";
  return key.toLowerCase();
}

export function getPlatformModifierLabel() {
  if (typeof navigator === "undefined") return "Ctrl";
  const platform = navigator.platform.toLowerCase();
  return platform.includes("mac") ? "⌘" : "Ctrl";
}

export function formatShortcutLabel(key: string, modifiers: KeyboardShortcutDefinition["modifiers"] = []) {
  const pieces = modifiers.length > 0 ? [getPlatformModifierLabel()] : [];
  const normalized = normalizeKey(key);
  const displayKey = normalized === "enter" ? "Enter" : normalized === "escape" ? "Esc" : normalized === "space" ? "Espace" : key.toUpperCase();
  return [...pieces, displayKey].join(modifiers.length > 0 && pieces[0] === "Ctrl" ? " " : "");
}

export function buildShortcutDisplay(shortcuts: readonly Omit<KeyboardShortcutDefinition, "handler">[]): KeyboardShortcutDisplay[] {
  return shortcuts.map((shortcut) => ({
    id: shortcut.id,
    label: shortcut.label,
    description: shortcut.description,
    category: shortcut.category,
    shortcut: formatShortcutLabel(shortcut.key, shortcut.modifiers)
  }));
}

