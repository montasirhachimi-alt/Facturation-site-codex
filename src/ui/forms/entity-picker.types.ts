import type { LucideIcon } from "lucide-react";

export type EntityPickerType = "company" | "contact" | "customer" | "product" | "quote" | "invoice" | (string & {});

export type EntityPickerItem = Readonly<{
  id: string;
  title: string;
  type: EntityPickerType;
  typeLabel: string;
  metadata: string;
  icon: LucideIcon;
  keywords?: readonly string[];
  disabled?: boolean;
}>;

export type EntityPickerSelection = Readonly<{
  value: string;
  item: EntityPickerItem | null;
}>;
