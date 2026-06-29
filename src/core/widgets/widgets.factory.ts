import type { WidgetInput } from "./widgets.types";
import { createWidget } from "./widgets.utils";

export type WidgetFactoryDefinition = WidgetInput & {
  templateId?: string;
};

export function createWidgetFromDefinition(definition: WidgetFactoryDefinition) {
  return createWidget(definition);
}

export function createWidgetsFromDefinitions(definitions: WidgetFactoryDefinition[]) {
  return definitions.map(createWidgetFromDefinition);
}
