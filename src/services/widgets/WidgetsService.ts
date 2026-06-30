import { widgetsService } from "@/core/widgets";
import type { HicoPilotWidgetCategory, HicoPilotWidgetType, WidgetInput } from "@/core/widgets";

export class WidgetsService {
  loadWidgets() {
    return widgetsService.getEnabled();
  }

  saveLayout(widgets: WidgetInput[]) {
    return widgets.map((widget) => widgetsService.register(widget));
  }

  getByCategory(category: HicoPilotWidgetCategory) {
    return widgetsService.getByCategory(category);
  }

  getByType(type: HicoPilotWidgetType) {
    return widgetsService.getByType(type);
  }

  toggle(id: string, enabled?: boolean) {
    return widgetsService.toggle(id, enabled);
  }

  pin(id: string, pinned?: boolean) {
    return widgetsService.pin(id, pinned);
  }

  favorite(id: string, favorite?: boolean) {
    return widgetsService.favorite(id, favorite);
  }
}
