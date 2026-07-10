export type KeyboardShortcutScope =
  | "global"
  | "workspace"
  | "table"
  | "dialog"
  | "form"
  | "picker"
  | "contextual-actions"
  | "pdf-preview";

export type KeyboardShortcutCategory = "Global" | "Formulaires" | "Navigation" | "Actions contextuelles";

export type KeyboardShortcutDefinition = Readonly<{
  id: string;
  key: string;
  modifiers?: readonly ("meta" | "ctrl" | "shift" | "alt")[];
  label: string;
  description: string;
  category: KeyboardShortcutCategory;
  scope: KeyboardShortcutScope;
  priority?: number;
  enabled?: boolean;
  allowInEditable?: boolean;
  preventDefault?: boolean;
  handler: (event: KeyboardEvent) => void;
}>;

export type KeyboardShortcutDisplay = Readonly<{
  id: string;
  label: string;
  description: string;
  category: KeyboardShortcutCategory;
  shortcut: string;
}>;

