import type { CrmSearchableEntity, CrmSortField } from "./crm-types";
import { compareCrmValues } from "./crm-utils";

export function sortCrmEntities<T extends CrmSearchableEntity>(entities: readonly T[], sort: readonly CrmSortField<keyof T & string>[]) {
  return Object.freeze(
    entities
      .map((entity, index) => ({ entity, index }))
      .sort((first, second) => {
        for (const fieldSort of sort) {
          const direction = fieldSort.direction === "asc" ? 1 : -1;
          const comparison = compareCrmValues(first.entity[fieldSort.field], second.entity[fieldSort.field]);
          if (comparison !== 0) return comparison * direction;
        }

        return first.index - second.index;
      })
      .map((item) => item.entity)
  );
}

