import type { LucideIcon } from "lucide-react";

export type UniversalSearchSectionId = "recent" | "suggestions" | "navigation" | (string & {});

export type UniversalSearchItem = Readonly<{
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actionId?: string;
  eyebrow?: string;
  badge?: string;
  disabled?: boolean;
  href?: string;
  keywords?: readonly string[];
  tone?: "default" | "create";
}>;

export type UniversalSearchSection = Readonly<{
  id: UniversalSearchSectionId;
  title: string;
  description: string;
  items: readonly UniversalSearchItem[];
  emptyTitle: string;
  emptyDescription: string;
}>;

export type UniversalSearchSectionResolver = (query: string) => readonly UniversalSearchSection[];
