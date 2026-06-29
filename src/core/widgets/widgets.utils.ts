import type { HicoPilotWidget, WidgetInput } from "./widgets.types";

export function createWidget(input: WidgetInput): HicoPilotWidget {
  const timestamp = new Date().toISOString();

  return {
    ...input,
    enabled: input.enabled ?? true,
    pinned: input.pinned ?? false,
    favorite: input.favorite ?? false,
    createdAt: input.createdAt ?? timestamp,
    updatedAt: input.updatedAt ?? timestamp
  };
}

export function sortWidgets(widgets: HicoPilotWidget[]) {
  return [...widgets].sort((first, second) => {
    if (first.pinned !== second.pinned) return first.pinned ? -1 : 1;
    if (first.position.area !== second.position.area) {
      return first.position.area.localeCompare(second.position.area);
    }
    if (first.position.row !== second.position.row) return first.position.row - second.position.row;
    if (first.position.column !== second.position.column) return first.position.column - second.position.column;

    return first.position.order - second.position.order;
  });
}

export function updateWidgetTimestamp(widget: HicoPilotWidget): HicoPilotWidget {
  return {
    ...widget,
    updatedAt: new Date().toISOString()
  };
}
