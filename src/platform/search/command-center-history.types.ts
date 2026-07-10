export type CommandCenterHistoryKind = "navigation" | "record";

export type CommandCenterHistoryItem = Readonly<{
  id: string;
  kind: CommandCenterHistoryKind;
  entityType: string;
  title: string;
  subtitle: string;
  route: string;
  iconKey: string;
  searchValue: string;
  timestamp: number;
  source: "command-center";
}>;

export type CommandCenterHistoryState = Readonly<{
  favorites: readonly CommandCenterHistoryItem[];
  recent: readonly CommandCenterHistoryItem[];
}>;
