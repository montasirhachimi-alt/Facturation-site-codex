import type { ActivityEventDefinition } from "./types";

const activityEventDefinitions: ActivityEventDefinition[] = [];

export function registerActivityEventDefinition(definition: ActivityEventDefinition) {
  activityEventDefinitions.push(definition);
}

export function getActivityEventDefinitions() {
  return [...activityEventDefinitions];
}

export function clearActivityEventDefinitions() {
  activityEventDefinitions.length = 0;
}
