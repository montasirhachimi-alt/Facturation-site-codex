import type { EntityPickerItem } from "./entity-picker.types";

export class EntityPickerRegistry {
  private readonly items = new Map<string, EntityPickerItem>();

  register(item: EntityPickerItem) {
    this.items.set(item.id, item);
    return this;
  }

  registerMany(items: readonly EntityPickerItem[]) {
    items.forEach((item) => this.register(item));
    return this;
  }

  getAll() {
    return Array.from(this.items.values());
  }

  getByTypes(types: readonly string[]) {
    const allowedTypes = new Set(types);
    return this.getAll().filter((item) => allowedTypes.has(item.type));
  }
}

export function createEntityPickerRegistry(items: readonly EntityPickerItem[] = []) {
  return new EntityPickerRegistry().registerMany(items);
}
