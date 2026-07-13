import type { InventoryAvailability, InventoryOperationResult, InventorySnapshot, ReservationRequest, StockMovement } from "./inventory.types";
import { InventoryService } from "./inventory.service";
import { singleIssue, validationResult } from "./inventory.validation";

export type ReservationServiceOptions = Readonly<{
  inventoryService: InventoryService;
}>;

export class ReservationService {
  private readonly inventoryService: InventoryService;

  constructor(options: ReservationServiceOptions) {
    this.inventoryService = options.inventoryService;
  }

  reserve(input: ReservationRequest): InventoryOperationResult<StockMovement> {
    const validation = this.validateReservationRequest(input);
    if (!validation.valid) return { validation };

    return this.inventoryService.reserve({
      companyId: input.companyId,
      productId: input.productId,
      toWarehouseId: input.warehouseId,
      quantity: input.quantity,
      reference: input.reference,
      referenceType: input.referenceType ?? "MANUAL",
      referenceId: input.referenceId,
      reason: input.reason,
      createdBy: input.createdBy
    });
  }

  release(input: ReservationRequest): InventoryOperationResult<StockMovement> {
    const validation = this.validateReservationRequest(input);
    if (!validation.valid) return { validation };

    return this.inventoryService.release({
      companyId: input.companyId,
      productId: input.productId,
      fromWarehouseId: input.warehouseId,
      quantity: input.quantity,
      reference: input.reference,
      referenceType: input.referenceType ?? "MANUAL",
      referenceId: input.referenceId,
      reason: input.reason,
      createdBy: input.createdBy
    });
  }

  canReserve(input: Pick<ReservationRequest, "companyId" | "productId" | "warehouseId" | "quantity">) {
    return this.inventoryService.canReserve(input);
  }

  canFulfill(input: Pick<ReservationRequest, "companyId" | "productId" | "warehouseId" | "quantity">) {
    return this.inventoryService.canFulfill(input);
  }

  getAvailability(input: Pick<ReservationRequest, "companyId" | "productId" | "warehouseId">): InventoryAvailability {
    return this.inventoryService.getAvailabilitySnapshot(input.companyId, input.productId, input.warehouseId);
  }

  recalculateAvailability(companyId?: ReservationRequest["companyId"]): InventorySnapshot {
    return this.inventoryService.recalculateAvailability(companyId);
  }

  private validateReservationRequest(input: ReservationRequest) {
    if (!input.companyId?.trim()) return singleIssue({ code: "missing_company", field: "companyId", message: "Company scope is required." });
    if (!input.productId?.trim()) return singleIssue({ code: "missing_product", field: "productId", message: "Product is required." });
    if (!input.warehouseId?.trim()) return singleIssue({ code: "missing_warehouse", field: "warehouseId", message: "Warehouse is required." });
    if (!Number.isFinite(input.quantity) || input.quantity <= 0) return singleIssue({ code: "invalid_quantity", field: "quantity", message: "Quantity must be greater than zero." });
    return validationResult([]);
  }
}
