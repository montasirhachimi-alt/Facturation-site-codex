import type { ActivityInput, HicoPilotActivity } from "./activity.types";

export function createActivity(input: ActivityInput): HicoPilotActivity {
  return {
    ...input,
    favorite: input.favorite ?? false,
    pinned: input.pinned ?? false
  };
}

export function sortActivitiesByDate(activities: HicoPilotActivity[]) {
  return [...activities].sort((first, second) => {
    return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
  });
}

export function sortActivitiesByPriority(activities: HicoPilotActivity[]) {
  return [...activities].sort((first, second) => {
    if (first.pinned !== second.pinned) return first.pinned ? -1 : 1;
    if (first.favorite !== second.favorite) return first.favorite ? -1 : 1;

    return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
  });
}
