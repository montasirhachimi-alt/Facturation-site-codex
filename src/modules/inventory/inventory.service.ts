import type { ProductId } from "@/modules/products";
import { DEFAULT_INVENTORY_POLICY } from "./inventory.constants";
import type {
  ArchiveWarehouseInput,
  CreateWarehouseInput,
  InventoryBalance,
  InventoryAvailability,
  InventoryCompanyId,
  InventoryMovementId,
  InventoryOperationResult,
  InventoryPolicy,
  InventorySnapshot,
  InventoryWarehouseId,
  PostMovementInput,
  StockMovement,
  UpdateWarehouseInput,
  Warehouse
} from "./inventory.types";
import { balanceKey, calculateQuantityAvailable, createAvailabilityFromBalance, createEmptyBalance, freezeBalance, freezeMovement, normalizeInventoryQuantity, normalizeWarehouseCode, roundQuantity } from "./inventory.utils";
import { singleIssue, validateCreateWarehouseInput, validatePostMovementInput, validateUpdateWarehouseInput, validationResult } from "./inventory.validation";

export type InventoryServiceOptions = Readonly<{
  warehouses?: readonly Warehouse[];
  balances?: readonly InventoryBalance[];
  movements?: readonly StockMovement[];
  now?: () => string;
  createWarehouseId?: () => InventoryWarehouseId;
  createMovementId?: () => InventoryMovementId;
  productExists?: (productId: ProductId, companyId: InventoryCompanyId) => boolean;
}>;

export class InventoryService {
  private readonly warehouses = new Map<InventoryWarehouseId, Warehouse>();
  private readonly balances = new Map<string, InventoryBalance>();
  private readonly movements = new Map<InventoryMovementId, StockMovement>();
  private readonly now: () => string;
  private readonly createWarehouseId: () => InventoryWarehouseId;
  private readonly createMovementId: () => InventoryMovementId;
  private readonly productExists?: (productId: ProductId, companyId: InventoryCompanyId) => boolean;

  constructor(options: InventoryServiceOptions = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.createWarehouseId = options.createWarehouseId ?? (() => `wh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` as InventoryWarehouseId);
    this.createMovementId = options.createMovementId ?? (() => `mov_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` as InventoryMovementId);
    this.productExists = options.productExists;
    this.replaceSnapshot({
      warehouses: options.warehouses ?? [],
      balances: options.balances ?? [],
      movements: options.movements ?? []
    });
  }

  replaceSnapshot(snapshot: InventorySnapshot) {
    this.warehouses.clear();
    this.balances.clear();
    this.movements.clear();
    snapshot.warehouses.forEach((warehouse) => this.warehouses.set(warehouse.id, freezeWarehouse(warehouse)));
    snapshot.balances.forEach((balance) => this.balances.set(balanceKey(balance.companyId, balance.productId, balance.warehouseId), freezeBalance(balance)));
    snapshot.movements.forEach((movement) => this.movements.set(movement.id, freezeMovement(movement)));
  }

  getSnapshot(companyId?: InventoryCompanyId): InventorySnapshot {
    const warehouses = [...this.warehouses.values()].filter((warehouse) => !companyId || warehouse.companyId === companyId);
    const balances = [...this.balances.values()].filter((balance) => !companyId || balance.companyId === companyId);
    const movements = [...this.movements.values()].filter((movement) => !companyId || movement.companyId === companyId);
    return Object.freeze({
      warehouses: Object.freeze(warehouses),
      balances: Object.freeze(balances),
      movements: Object.freeze(movements)
    });
  }

  createWarehouse(input: CreateWarehouseInput): InventoryOperationResult<Warehouse> {
    const baseValidation = validateCreateWarehouseInput(input);
    if (!baseValidation.valid) return { validation: baseValidation };

    const code = normalizeWarehouseCode(input.code);
    if (this.hasWarehouseCode(input.companyId, code)) {
      return { validation: singleIssue({ code: "duplicate_warehouse_code", field: "code", message: "Warehouse code already exists." }) };
    }

    const timestamp = this.now();
    const warehouse = freezeWarehouse({
      id: this.createWarehouseId(),
      companyId: input.companyId,
      code,
      name: input.name.trim(),
      description: optionalText(input.description),
      active: true,
      isDefault: input.isDefault ?? false,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    if (warehouse.isDefault) this.clearDefaultWarehouse(input.companyId);
    this.warehouses.set(warehouse.id, warehouse);
    return { data: warehouse, validation: validationResult([]) };
  }

  updateWarehouse(input: UpdateWarehouseInput): InventoryOperationResult<Warehouse> {
    const validation = validateUpdateWarehouseInput(input);
    if (!validation.valid) return { validation };

    const existing = this.warehouses.get(input.warehouseId);
    if (!existing || existing.companyId !== input.companyId) {
      return { validation: singleIssue({ code: "missing_warehouse", field: "warehouseId", message: "Warehouse was not found." }) };
    }

    const code = input.code === undefined ? existing.code : normalizeWarehouseCode(input.code);
    if (code !== existing.code && this.hasWarehouseCode(input.companyId, code, existing.id)) {
      return { validation: singleIssue({ code: "duplicate_warehouse_code", field: "code", message: "Warehouse code already exists." }) };
    }

    const warehouse = freezeWarehouse({
      ...existing,
      code,
      name: input.name === undefined ? existing.name : input.name.trim(),
      description: input.description === undefined ? existing.description : optionalText(input.description),
      active: input.active ?? existing.active,
      isDefault: input.active === false ? false : input.isDefault ?? existing.isDefault,
      updatedAt: this.now()
    });
    if (warehouse.isDefault) this.clearDefaultWarehouse(input.companyId, warehouse.id);
    this.warehouses.set(warehouse.id, warehouse);
    return { data: warehouse, validation: validationResult([]) };
  }

  archiveWarehouse(input: ArchiveWarehouseInput): InventoryOperationResult<Warehouse> {
    const existing = this.warehouses.get(input.warehouseId);
    if (!existing || existing.companyId !== input.companyId) {
      return { validation: singleIssue({ code: "missing_warehouse", field: "warehouseId", message: "Warehouse was not found." }) };
    }

    const warehouse = freezeWarehouse({
      ...existing,
      active: false,
      isDefault: false,
      updatedAt: this.now()
    });
    this.warehouses.set(warehouse.id, warehouse);
    return { data: warehouse, validation: validationResult([]) };
  }

  getBalance(companyId: InventoryCompanyId, productId: ProductId, warehouseId: InventoryWarehouseId) {
    return this.balances.get(balanceKey(companyId, productId, warehouseId));
  }

  getAvailability(companyId: InventoryCompanyId, productId: ProductId, warehouseId: InventoryWarehouseId) {
    return this.getBalance(companyId, productId, warehouseId)?.quantityAvailable ?? 0;
  }

  getAvailabilitySnapshot(companyId: InventoryCompanyId, productId: ProductId, warehouseId: InventoryWarehouseId): InventoryAvailability {
    const balance = this.getBalance(companyId, productId, warehouseId) ?? createEmptyBalance({ companyId, productId, warehouseId, now: this.now() });
    return createAvailabilityFromBalance(balance);
  }

  recalculateAvailability(companyId?: InventoryCompanyId) {
    const balances = [...this.balances.values()].filter((balance) => !companyId || balance.companyId === companyId);
    balances.forEach((balance) => this.setBalance(balance));
    return this.getSnapshot(companyId);
  }

  canReserve(input: { companyId: InventoryCompanyId; productId: ProductId; warehouseId: InventoryWarehouseId; quantity: number }) {
    if (!Number.isFinite(input.quantity) || input.quantity <= 0) return false;
    return this.getAvailability(input.companyId, input.productId, input.warehouseId) >= input.quantity;
  }

  canFulfill(input: { companyId: InventoryCompanyId; productId: ProductId; warehouseId: InventoryWarehouseId; quantity: number }) {
    return this.canReserve(input);
  }

  postReceipt(input: Omit<PostMovementInput, "type" | "fromWarehouseId">) {
    return this.postMovement({ ...input, type: "RECEIPT" });
  }

  postIssue(input: Omit<PostMovementInput, "type" | "toWarehouseId">) {
    return this.postMovement({ ...input, type: "ISSUE" });
  }

  postTransfer(input: Omit<PostMovementInput, "type">) {
    return this.postMovement({ ...input, type: "TRANSFER" });
  }

  postAdjustment(input: Omit<PostMovementInput, "type"> & Readonly<{ direction: "in" | "out" }>) {
    return this.postMovement({ ...input, type: input.direction === "in" ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT" });
  }

  reserve(input: Omit<PostMovementInput, "type" | "fromWarehouseId">) {
    return this.postMovement({ ...input, type: "RESERVATION" });
  }

  release(input: Omit<PostMovementInput, "type" | "toWarehouseId">) {
    return this.postMovement({ ...input, type: "RELEASE" });
  }

  postMovement(input: PostMovementInput): InventoryOperationResult<StockMovement> {
    const normalizedInput = { ...input, quantity: normalizeInventoryQuantity(input.quantity) };
    const validation = this.validatePosting(normalizedInput);
    if (!validation.valid) return { validation };

    const snapshot = this.getSnapshot(normalizedInput.companyId);
    try {
      const movement = this.applyPostedMovement(normalizedInput);
      return { data: movement, validation: validationResult([]) };
    } catch (error) {
      this.replaceSnapshot(snapshot);
      return {
        validation: singleIssue({
          code: "invalid_movement",
          message: error instanceof Error ? error.message : "Inventory posting failed."
        })
      };
    }
  }

  private validatePosting(input: PostMovementInput) {
    const baseValidation = validatePostMovementInput(input);
    if (!baseValidation.valid) return baseValidation;

    if (input.id && this.movements.get(input.id)?.status === "POSTED") {
      return singleIssue({ code: "duplicate_posting", field: "id", message: "Movement has already been posted." });
    }

    if (this.productExists && !this.productExists(input.productId, input.companyId)) {
      return singleIssue({ code: "missing_product", field: "productId", message: "Product does not exist for this company." });
    }

    const warehouseIssue = this.validateWarehouses(input);
    if (warehouseIssue) return singleIssue(warehouseIssue);

    const policy = { ...DEFAULT_INVENTORY_POLICY, ...(input.policy ?? {}) };
    if (!policy.allowNegativeStock) {
      const stockIssue = this.validateAvailability(input, policy);
      if (stockIssue) return singleIssue(stockIssue);
    }

    return validationResult([]);
  }

  private validateWarehouses(input: PostMovementInput) {
    const warehouseIds = [input.fromWarehouseId, input.toWarehouseId].filter(Boolean) as InventoryWarehouseId[];
    for (const warehouseId of warehouseIds) {
      const warehouse = this.warehouses.get(warehouseId);
      if (!warehouse || warehouse.companyId !== input.companyId) {
        return { code: "missing_warehouse" as const, field: "warehouseId", message: "Warehouse was not found." };
      }
      if (!warehouse.active) {
        return { code: "inactive_warehouse" as const, field: "warehouseId", message: "Warehouse is inactive." };
      }
    }
    return undefined;
  }

  private validateAvailability(input: PostMovementInput, policy: InventoryPolicy) {
    if (policy.allowNegativeStock) return undefined;
    if ((input.type === "ISSUE" || input.type === "TRANSFER" || input.type === "ADJUSTMENT_OUT") && input.fromWarehouseId) {
      const available = this.getAvailability(input.companyId, input.productId, input.fromWarehouseId);
      if (available < input.quantity) {
        return { code: "insufficient_stock" as const, field: "quantity", message: "Available stock is insufficient." };
      }
    }

    if (input.type === "RESERVATION" && input.toWarehouseId) {
      const available = this.getAvailability(input.companyId, input.productId, input.toWarehouseId);
      if (available < input.quantity) {
        return { code: "insufficient_stock" as const, field: "quantity", message: "Available stock is insufficient for reservation." };
      }
    }

    if (input.type === "RELEASE" && input.fromWarehouseId) {
      const reserved = this.getBalance(input.companyId, input.productId, input.fromWarehouseId)?.quantityReserved ?? 0;
      if (reserved < input.quantity) {
        return { code: "insufficient_reserved" as const, field: "quantity", message: "Reserved stock is insufficient." };
      }
    }

    return undefined;
  }

  private applyPostedMovement(input: PostMovementInput) {
    const timestamp = this.now();
    if (input.type === "RECEIPT" || input.type === "ADJUSTMENT_IN") this.incrementOnHand(input.companyId, input.productId, input.toWarehouseId!, input.quantity, timestamp);
    if (input.type === "ISSUE" || input.type === "ADJUSTMENT_OUT") this.incrementOnHand(input.companyId, input.productId, input.fromWarehouseId!, -input.quantity, timestamp);
    if (input.type === "TRANSFER") {
      this.incrementOnHand(input.companyId, input.productId, input.fromWarehouseId!, -input.quantity, timestamp);
      this.incrementOnHand(input.companyId, input.productId, input.toWarehouseId!, input.quantity, timestamp);
    }
    if (input.type === "RESERVATION") this.incrementReserved(input.companyId, input.productId, input.toWarehouseId!, input.quantity, timestamp);
    if (input.type === "RELEASE") this.incrementReserved(input.companyId, input.productId, input.fromWarehouseId!, -input.quantity, timestamp);

    const movement = freezeMovement({
      id: input.id ?? this.createMovementId(),
      companyId: input.companyId,
      productId: input.productId,
      fromWarehouseId: input.fromWarehouseId,
      toWarehouseId: input.toWarehouseId,
      type: input.type,
      status: "POSTED",
      quantity: roundQuantity(input.quantity),
      reference: optionalText(input.reference),
      referenceType: input.referenceType,
      referenceId: optionalText(input.referenceId),
      reason: optionalText(input.reason),
      postedAt: timestamp,
      createdBy: input.createdBy,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    this.movements.set(movement.id, movement);
    return movement;
  }

  private incrementOnHand(companyId: InventoryCompanyId, productId: ProductId, warehouseId: InventoryWarehouseId, delta: number, timestamp: string) {
    const balance = this.getOrCreateBalance(companyId, productId, warehouseId, timestamp);
    this.setBalance({
      ...balance,
      quantityOnHand: roundQuantity(balance.quantityOnHand + delta),
      lastMovementDate: timestamp,
      updatedAt: timestamp
    });
  }

  private incrementReserved(companyId: InventoryCompanyId, productId: ProductId, warehouseId: InventoryWarehouseId, delta: number, timestamp: string) {
    const balance = this.getOrCreateBalance(companyId, productId, warehouseId, timestamp);
    this.setBalance({
      ...balance,
      quantityReserved: roundQuantity(balance.quantityReserved + delta),
      lastMovementDate: timestamp,
      updatedAt: timestamp
    });
  }

  private getOrCreateBalance(companyId: InventoryCompanyId, productId: ProductId, warehouseId: InventoryWarehouseId, timestamp: string) {
    return this.getBalance(companyId, productId, warehouseId) ?? createEmptyBalance({ companyId, productId, warehouseId, now: timestamp });
  }

  private setBalance(balance: InventoryBalance) {
    const frozen = freezeBalance({
      ...balance,
      quantityAvailable: calculateQuantityAvailable(balance.quantityOnHand, balance.quantityReserved)
    });
    this.balances.set(balanceKey(frozen.companyId, frozen.productId, frozen.warehouseId), frozen);
  }

  private hasWarehouseCode(companyId: InventoryCompanyId, code: string, ignoredId?: InventoryWarehouseId) {
    return [...this.warehouses.values()].some((warehouse) => warehouse.companyId === companyId && warehouse.code === code && warehouse.id !== ignoredId);
  }

  private hasDefaultWarehouse(companyId: InventoryCompanyId) {
    return [...this.warehouses.values()].some((warehouse) => warehouse.companyId === companyId && warehouse.isDefault && warehouse.active);
  }

  private clearDefaultWarehouse(companyId: InventoryCompanyId, ignoredId?: InventoryWarehouseId) {
    [...this.warehouses.values()].forEach((warehouse) => {
      if (warehouse.companyId !== companyId || warehouse.id === ignoredId || !warehouse.isDefault) return;
      this.warehouses.set(warehouse.id, freezeWarehouse({ ...warehouse, isDefault: false, updatedAt: this.now() }));
    });
  }
}

export function freezeWarehouse(warehouse: Warehouse): Warehouse {
  return Object.freeze({ ...warehouse });
}

function optionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || undefined;
}

export const inventoryService = new InventoryService();
