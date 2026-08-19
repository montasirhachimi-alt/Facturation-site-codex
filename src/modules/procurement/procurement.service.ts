import { DEFAULT_PROCUREMENT_CURRENCY, DEFAULT_SUPPLIER_COUNTRY } from "./procurement.constants";
import type {
  CreateGoodsReceiptInput,
  CreatePurchaseOrderInput,
  CreateSupplierBillInput,
  CreateSupplierPaymentInput,
  CreateSupplierInput,
  GoodsReceipt,
  GoodsReceiptFilters,
  GoodsReceiptId,
  ProcurementSupplier,
  ProcurementSupplierId,
  PurchaseOrder,
  PurchaseOrderFilters,
  PurchaseOrderId,
  SupplierBill,
  SupplierBillFilters,
  SupplierBillId,
  SupplierPayment,
  SupplierPaymentFilters,
  SupplierPaymentId,
  SupplierFilters,
  UpdatePurchaseOrderInput,
  UpdateSupplierBillInput,
  UpdateSupplierPaymentInput,
  UpdateSupplierInput
} from "./procurement.types";
import {
  calculateSupplierBillPaymentState,
  formatGoodsReceiptNumber,
  formatPurchaseOrderNumber,
  formatSupplierBillNumber,
  formatSupplierPaymentNumber,
  matchesSupplierPaymentSearch,
  getPurchaseOrderReceiptState,
  matchesGoodsReceiptSearch,
  matchesPurchaseOrderSearch,
  matchesSupplierBillSearch,
  matchesSupplierSearch,
  normalizeProcurementText,
  normalizePurchaseOrderLines,
  normalizeSupplierBillLines,
  roundMoney
} from "./procurement.utils";

export class ProcurementService {
  private readonly suppliers = new Map<ProcurementSupplierId, ProcurementSupplier>();
  private readonly purchaseOrders = new Map<PurchaseOrderId, PurchaseOrder>();
  private readonly goodsReceipts = new Map<GoodsReceiptId, GoodsReceipt>();
  private readonly supplierBills = new Map<SupplierBillId, SupplierBill>();
  private readonly supplierPayments = new Map<SupplierPaymentId, SupplierPayment>();
  private readonly now: () => string;

  constructor(options: { suppliers?: readonly ProcurementSupplier[]; purchaseOrders?: readonly PurchaseOrder[]; goodsReceipts?: readonly GoodsReceipt[]; supplierBills?: readonly SupplierBill[]; supplierPayments?: readonly SupplierPayment[]; now?: () => string } = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    options.suppliers?.forEach((supplier) => this.suppliers.set(supplier.id, freezeSupplier(supplier)));
    options.purchaseOrders?.forEach((order) => this.purchaseOrders.set(order.id, freezePurchaseOrder(order)));
    options.goodsReceipts?.forEach((receipt) => this.goodsReceipts.set(receipt.id, freezeGoodsReceipt(receipt)));
    options.supplierBills?.forEach((bill) => this.supplierBills.set(bill.id, freezeSupplierBill(bill)));
    options.supplierPayments?.forEach((payment) => this.supplierPayments.set(payment.id, freezeSupplierPayment(payment)));
  }

  replaceSuppliers(suppliers: readonly ProcurementSupplier[]) {
    this.suppliers.clear();
    suppliers.forEach((supplier) => this.suppliers.set(supplier.id, freezeSupplier(supplier)));
  }

  replacePurchaseOrders(orders: readonly PurchaseOrder[]) {
    this.purchaseOrders.clear();
    orders.forEach((order) => this.purchaseOrders.set(order.id, freezePurchaseOrder(order)));
  }

  replaceGoodsReceipts(receipts: readonly GoodsReceipt[]) {
    this.goodsReceipts.clear();
    receipts.forEach((receipt) => this.goodsReceipts.set(receipt.id, freezeGoodsReceipt(receipt)));
  }

  replaceSupplierBills(bills: readonly SupplierBill[]) {
    this.supplierBills.clear();
    bills.forEach((bill) => this.supplierBills.set(bill.id, freezeSupplierBill(bill)));
  }

  replaceSupplierPayments(payments: readonly SupplierPayment[]) {
    this.supplierPayments.clear();
    payments.forEach((payment) => this.supplierPayments.set(payment.id, freezeSupplierPayment(payment)));
  }

  listSuppliers(filters: SupplierFilters) {
    const suppliers = [...this.suppliers.values()]
      .filter((supplier) => supplier.workspaceId === filters.workspaceId)
      .filter((supplier) => filters.includeArchived || supplier.status !== "archived")
      .filter((supplier) => !filters.status || filters.status === "all" || supplier.status === filters.status)
      .filter((supplier) => !filters.query || matchesSupplierSearch(supplier, filters.query))
      .sort((left, right) => left.companyName.localeCompare(right.companyName, "fr"));
    return Object.freeze({ suppliers: Object.freeze(suppliers), total: suppliers.length });
  }

  listPurchaseOrders(filters: PurchaseOrderFilters) {
    const orders = [...this.purchaseOrders.values()]
      .filter((order) => order.workspaceId === filters.workspaceId)
      .filter((order) => filters.includeArchived || order.status !== "archived")
      .filter((order) => !filters.status || filters.status === "all" || order.status === filters.status)
      .filter((order) => !filters.supplierId || filters.supplierId === "all" || order.supplierId === filters.supplierId)
      .filter((order) => !filters.query || matchesPurchaseOrderSearch(order, filters.query))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    return Object.freeze({ purchaseOrders: Object.freeze(orders), total: orders.length });
  }

  listGoodsReceipts(filters: GoodsReceiptFilters) {
    const receipts = [...this.goodsReceipts.values()]
      .filter((receipt) => receipt.workspaceId === filters.workspaceId)
      .filter((receipt) => filters.includeArchived || receipt.status !== "archived")
      .filter((receipt) => !filters.status || filters.status === "all" || receipt.status === filters.status)
      .filter((receipt) => !filters.supplierId || filters.supplierId === "all" || receipt.supplierId === filters.supplierId)
      .filter((receipt) => !filters.purchaseOrderId || filters.purchaseOrderId === "all" || receipt.purchaseOrderId === filters.purchaseOrderId)
      .filter((receipt) => !filters.query || matchesGoodsReceiptSearch(receipt, filters.query))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    return Object.freeze({ goodsReceipts: Object.freeze(receipts), total: receipts.length });
  }

  listSupplierBills(filters: SupplierBillFilters) {
    const bills = [...this.supplierBills.values()]
      .filter((bill) => bill.workspaceId === filters.workspaceId)
      .filter((bill) => filters.includeArchived || bill.status !== "archived")
      .filter((bill) => !filters.status || filters.status === "all" || bill.status === filters.status)
      .filter((bill) => !filters.supplierId || filters.supplierId === "all" || bill.supplierId === filters.supplierId)
      .filter((bill) => !filters.purchaseOrderId || filters.purchaseOrderId === "all" || bill.purchaseOrderId === filters.purchaseOrderId)
      .filter((bill) => !filters.query || matchesSupplierBillSearch(bill, filters.query))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    return Object.freeze({ supplierBills: Object.freeze(bills), total: bills.length });
  }

  listSupplierPayments(filters: SupplierPaymentFilters) {
    const payments = [...this.supplierPayments.values()]
      .filter((payment) => payment.workspaceId === filters.workspaceId)
      .filter((payment) => filters.includeArchived || payment.status !== "archived")
      .filter((payment) => !filters.status || filters.status === "all" || payment.status === filters.status)
      .filter((payment) => !filters.supplierId || filters.supplierId === "all" || payment.supplierId === filters.supplierId)
      .filter((payment) => !filters.supplierBillId || filters.supplierBillId === "all" || payment.supplierBillId === filters.supplierBillId)
      .filter((payment) => !filters.query || matchesSupplierPaymentSearch(payment, filters.query))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    return Object.freeze({ supplierPayments: Object.freeze(payments), total: payments.length });
  }

  getSupplier(id: ProcurementSupplierId, workspaceId: SupplierFilters["workspaceId"]) {
    const supplier = this.suppliers.get(id);
    return supplier?.workspaceId === workspaceId ? supplier : undefined;
  }

  getPurchaseOrder(id: PurchaseOrderId, workspaceId: PurchaseOrderFilters["workspaceId"]) {
    const order = this.purchaseOrders.get(id);
    return order?.workspaceId === workspaceId ? order : undefined;
  }

  getGoodsReceipt(id: GoodsReceiptId, workspaceId: GoodsReceiptFilters["workspaceId"]) {
    const receipt = this.goodsReceipts.get(id);
    return receipt?.workspaceId === workspaceId ? receipt : undefined;
  }

  getSupplierBill(id: SupplierBillId, workspaceId: SupplierBillFilters["workspaceId"]) {
    const bill = this.supplierBills.get(id);
    return bill?.workspaceId === workspaceId ? bill : undefined;
  }

  getSupplierPayment(id: SupplierPaymentId, workspaceId: SupplierPaymentFilters["workspaceId"]) {
    const payment = this.supplierPayments.get(id);
    return payment?.workspaceId === workspaceId ? payment : undefined;
  }

  upsertSupplier(supplier: ProcurementSupplier) {
    const frozen = freezeSupplier(supplier);
    this.suppliers.set(frozen.id, frozen);
    return frozen;
  }

  upsertPurchaseOrder(order: PurchaseOrder) {
    const frozen = freezePurchaseOrder(order);
    this.purchaseOrders.set(frozen.id, frozen);
    return frozen;
  }

  removePurchaseOrder(id: PurchaseOrderId, workspaceId: PurchaseOrderFilters["workspaceId"]) {
    const existing = this.getPurchaseOrder(id, workspaceId);
    if (!existing) return Object.freeze({ purchaseOrder: undefined, error: "Commande fournisseur introuvable." });
    if (existing.status !== "draft") return Object.freeze({ purchaseOrder: undefined, error: "Seuls les brouillons peuvent être supprimés." });
    this.purchaseOrders.delete(id);
    return Object.freeze({ purchaseOrder: existing });
  }

  upsertGoodsReceipt(receipt: GoodsReceipt) {
    const frozen = freezeGoodsReceipt(receipt);
    this.goodsReceipts.set(frozen.id, frozen);
    return frozen;
  }

  upsertSupplierBill(bill: SupplierBill) {
    const frozen = freezeSupplierBill(bill);
    this.supplierBills.set(frozen.id, frozen);
    return frozen;
  }

  upsertSupplierPayment(payment: SupplierPayment) {
    const frozen = freezeSupplierPayment(payment);
    this.supplierPayments.set(frozen.id, frozen);
    return frozen;
  }

  createSupplier(input: CreateSupplierInput) {
    const companyName = normalizeProcurementText(input.companyName);
    if (!companyName) return Object.freeze({ supplier: undefined, error: "Le nom du fournisseur est obligatoire." });
    const timestamp = this.now();
    const supplier = freezeSupplier({
      ...input,
      id: `supplier-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` as ProcurementSupplierId,
      companyName,
      tradeName: clean(input.tradeName),
      ice: clean(input.ice),
      taxId: clean(input.taxId),
      rc: clean(input.rc),
      vat: clean(input.vat),
      phone: clean(input.phone),
      email: clean(input.email),
      address: clean(input.address),
      country: clean(input.country) ?? DEFAULT_SUPPLIER_COUNTRY,
      currency: clean(input.currency) ?? DEFAULT_PROCUREMENT_CURRENCY,
      paymentTerms: clean(input.paymentTerms),
      notes: clean(input.notes),
      status: "active",
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    this.suppliers.set(supplier.id, supplier);
    return Object.freeze({ supplier });
  }

  updateSupplier(input: UpdateSupplierInput) {
    const existing = this.getSupplier(input.id, input.workspaceId);
    if (!existing) return Object.freeze({ supplier: undefined, error: "Fournisseur introuvable." });
    const updated = freezeSupplier({
      ...existing,
      ...input,
      companyName: normalizeProcurementText(input.companyName ?? existing.companyName),
      tradeName: clean(input.tradeName) ?? existing.tradeName,
      status: input.status ?? existing.status,
      active: input.active ?? existing.active,
      archivedAt: input.status === "archived" || input.active === false ? this.now() : existing.archivedAt,
      updatedAt: this.now()
    });
    this.suppliers.set(updated.id, updated);
    return Object.freeze({ supplier: updated });
  }

  archiveSupplier(id: ProcurementSupplierId, workspaceId: SupplierFilters["workspaceId"]) {
    return this.updateSupplier({ id, workspaceId, status: "archived", active: false });
  }

  createPurchaseOrder(input: CreatePurchaseOrderInput) {
    const supplier = this.getSupplier(input.supplierId, input.workspaceId);
    const lines = normalizePurchaseOrderLines(input.lines);
    if (!supplier && !input.supplierName) return Object.freeze({ purchaseOrder: undefined, error: "Sélectionnez un fournisseur." });
    if (lines.length === 0) return Object.freeze({ purchaseOrder: undefined, error: "Ajoutez au moins une ligne d'achat." });
    const timestamp = this.now();
    const order = freezePurchaseOrder({
      ...input,
      id: `po-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` as PurchaseOrderId,
      number: formatPurchaseOrderNumber(this.purchaseOrders.size + 1),
      supplierName: input.supplierName ?? supplier?.companyName ?? "Fournisseur",
      status: input.status ?? "draft",
      currency: input.currency || supplier?.currency || DEFAULT_PROCUREMENT_CURRENCY,
      lines,
      discountRate: input.discountRate ?? 0,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    this.purchaseOrders.set(order.id, order);
    return Object.freeze({ purchaseOrder: order });
  }

  updatePurchaseOrder(input: UpdatePurchaseOrderInput) {
    const existing = this.getPurchaseOrder(input.id, input.workspaceId);
    if (!existing) return Object.freeze({ purchaseOrder: undefined, error: "Commande fournisseur introuvable." });
    const updated = freezePurchaseOrder({
      ...existing,
      ...input,
      lines: input.lines ? normalizePurchaseOrderLines(input.lines) : existing.lines,
      updatedAt: this.now()
    });
    this.purchaseOrders.set(updated.id, updated);
    return Object.freeze({ purchaseOrder: updated });
  }

  createGoodsReceipt(input: CreateGoodsReceiptInput) {
    const order = this.getPurchaseOrder(input.purchaseOrderId, input.workspaceId);
    if (!order) return Object.freeze({ goodsReceipt: undefined, error: "Commande fournisseur introuvable." });
    const supplier = this.getSupplier(input.supplierId, input.workspaceId);
    if (!supplier && !input.supplierName) return Object.freeze({ goodsReceipt: undefined, error: "Fournisseur introuvable." });
    if (!input.warehouseId) return Object.freeze({ goodsReceipt: undefined, error: "Sélectionnez un entrepôt." });
    const lines = input.lines.filter((line) => line.productId && line.receivedQuantity > 0);
    if (lines.length === 0) return Object.freeze({ goodsReceipt: undefined, error: "Ajoutez au moins une quantité reçue." });
    const timestamp = this.now();
    const receipt = freezeGoodsReceipt({
      ...input,
      id: `gr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` as GoodsReceiptId,
      number: formatGoodsReceiptNumber(this.goodsReceipts.size + 1),
      supplierName: input.supplierName ?? supplier?.companyName ?? order.supplierName,
      purchaseOrderNumber: input.purchaseOrderNumber ?? order.number,
      status: input.status ?? "draft",
      lines,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    this.goodsReceipts.set(receipt.id, receipt);
    return Object.freeze({ goodsReceipt: receipt });
  }

  createSupplierBill(input: CreateSupplierBillInput) {
    const supplier = this.getSupplier(input.supplierId, input.workspaceId);
    if (!supplier && !input.supplierName) return Object.freeze({ supplierBill: undefined, error: "Sélectionnez un fournisseur." });
    const lines = normalizeSupplierBillLines(input.lines);
    if (lines.length === 0) return Object.freeze({ supplierBill: undefined, error: "Ajoutez au moins une ligne de facture fournisseur." });
    const timestamp = this.now();
    const order = input.purchaseOrderId ? this.getPurchaseOrder(input.purchaseOrderId, input.workspaceId) : undefined;
    const receipt = input.goodsReceiptId ? this.getGoodsReceipt(input.goodsReceiptId, input.workspaceId) : undefined;
    const bill = freezeSupplierBill({
      ...input,
      id: `supplier-bill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` as SupplierBillId,
      number: formatSupplierBillNumber(this.supplierBills.size + 1),
      supplierName: input.supplierName ?? supplier?.companyName ?? "Fournisseur",
      purchaseOrderNumber: input.purchaseOrderNumber ?? order?.number,
      goodsReceiptNumber: input.goodsReceiptNumber ?? receipt?.number,
      currency: input.currency || supplier?.currency || order?.currency || DEFAULT_PROCUREMENT_CURRENCY,
      status: input.status ?? "draft",
      lines,
      discountRate: input.discountRate ?? 0,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    this.supplierBills.set(bill.id, bill);
    return Object.freeze({ supplierBill: bill });
  }

  updateSupplierBill(input: UpdateSupplierBillInput) {
    const existing = this.getSupplierBill(input.id, input.workspaceId);
    if (!existing) return Object.freeze({ supplierBill: undefined, error: "Facture fournisseur introuvable." });
    if (existing.status === "accounted" && input.status !== "accounted") {
      return Object.freeze({ supplierBill: undefined, error: "Une facture fournisseur comptabilisée ne peut pas être modifiée silencieusement." });
    }
    const updated = freezeSupplierBill({
      ...existing,
      ...input,
      lines: input.lines ? normalizeSupplierBillLines(input.lines) : existing.lines,
      updatedAt: this.now()
    });
    this.supplierBills.set(updated.id, updated);
    return Object.freeze({ supplierBill: updated });
  }

  createSupplierPayment(input: CreateSupplierPaymentInput) {
    const supplier = this.getSupplier(input.supplierId, input.workspaceId);
    const bill = this.getSupplierBill(input.supplierBillId, input.workspaceId);
    if (!supplier && !input.supplierName) return Object.freeze({ supplierPayment: undefined, error: "Sélectionnez un fournisseur." });
    if (!bill && !input.supplierBillNumber) return Object.freeze({ supplierPayment: undefined, error: "Sélectionnez une facture fournisseur." });
    if (bill && bill.status !== "accounted") return Object.freeze({ supplierPayment: undefined, error: "La facture fournisseur doit être comptabilisée avant règlement." });
    if (input.status === "accounted") return Object.freeze({ supplierPayment: undefined, error: "Comptabilisez le règlement depuis Finance après son enregistrement." });
    const amount = roundMoney(Number(input.amount));
    if (!Number.isFinite(amount) || amount <= 0) return Object.freeze({ supplierPayment: undefined, error: "Le montant du règlement doit être supérieur à zéro." });
    const currency = (input.currency || bill?.currency || DEFAULT_PROCUREMENT_CURRENCY).trim().toUpperCase();
    if (bill && currency !== bill.currency.trim().toUpperCase()) return Object.freeze({ supplierPayment: undefined, error: "La devise du règlement doit correspondre à la facture fournisseur." });
    if (bill) {
      const paymentState = calculateSupplierBillPaymentState(bill, [...this.supplierPayments.values()]);
      if (amount > paymentState.outstandingAmount) return Object.freeze({ supplierPayment: undefined, error: "Le règlement dépasse le solde fournisseur à payer." });
    }
    const timestamp = this.now();
    const finalizedAt = input.status === "finalized" ? input.finalizedAt ?? timestamp : input.finalizedAt;
    const payment = freezeSupplierPayment({
      ...input,
      id: `supplier-payment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` as SupplierPaymentId,
      number: formatSupplierPaymentNumber(this.supplierPayments.size + 1),
      supplierName: input.supplierName ?? supplier?.companyName ?? bill?.supplierName ?? "Fournisseur",
      supplierBillNumber: input.supplierBillNumber ?? bill?.number ?? "Facture fournisseur",
      amount,
      currency,
      method: input.method ?? "bank_transfer",
      status: input.status ?? "draft",
      finalizedAt,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    this.supplierPayments.set(payment.id, payment);
    return Object.freeze({ supplierPayment: payment });
  }

  updateSupplierPayment(input: UpdateSupplierPaymentInput) {
    const existing = this.getSupplierPayment(input.id, input.workspaceId);
    if (!existing) return Object.freeze({ supplierPayment: undefined, error: "Règlement fournisseur introuvable." });
    if (existing.status === "accounted" && input.status !== "accounted") {
      return Object.freeze({ supplierPayment: undefined, error: "Un règlement fournisseur comptabilisé ne peut pas être modifié silencieusement." });
    }
    if (input.amount !== undefined) {
      const amount = roundMoney(Number(input.amount));
      if (!Number.isFinite(amount) || amount <= 0) return Object.freeze({ supplierPayment: undefined, error: "Le montant du règlement doit être supérieur à zéro." });
    }
    const updated = freezeSupplierPayment({
      ...existing,
      ...input,
      amount: input.amount === undefined ? existing.amount : roundMoney(Number(input.amount)),
      currency: input.currency?.trim().toUpperCase() ?? existing.currency,
      finalizedAt: input.status === "finalized" && !existing.finalizedAt ? this.now() : input.finalizedAt ?? existing.finalizedAt,
      updatedAt: this.now()
    });
    this.supplierPayments.set(updated.id, updated);
    return Object.freeze({ supplierPayment: updated });
  }

  markGoodsReceiptPosted(id: GoodsReceiptId, workspaceId: GoodsReceiptFilters["workspaceId"], postedAt = this.now()) {
    const existing = this.getGoodsReceipt(id, workspaceId);
    if (!existing) return Object.freeze({ goodsReceipt: undefined, error: "Réception introuvable." });
    if (existing.status === "posted") return Object.freeze({ goodsReceipt: undefined, error: "Cette réception est déjà postée." });
    const posted = freezeGoodsReceipt({ ...existing, status: "posted", postedAt, updatedAt: postedAt });
    this.goodsReceipts.set(posted.id, posted);
    this.syncPurchaseOrderReceiptStatus(posted.purchaseOrderId, posted.workspaceId);
    return Object.freeze({ goodsReceipt: posted });
  }

  getPurchaseOrderReceiptState(orderId: PurchaseOrderId, workspaceId: PurchaseOrderFilters["workspaceId"]) {
    const order = this.getPurchaseOrder(orderId, workspaceId);
    if (!order) return undefined;
    return getPurchaseOrderReceiptState(order, [...this.goodsReceipts.values()]);
  }

  private syncPurchaseOrderReceiptStatus(orderId: PurchaseOrderId, workspaceId: PurchaseOrderFilters["workspaceId"]) {
    const order = this.getPurchaseOrder(orderId, workspaceId);
    if (!order) return;
    const state = getPurchaseOrderReceiptState(order, [...this.goodsReceipts.values()]);
    const status = state.fullyReceived ? "received" : state.partiallyReceived ? "partially_received" : order.status;
    this.purchaseOrders.set(order.id, freezePurchaseOrder({ ...order, status, updatedAt: this.now() }));
  }
}

export function freezeSupplier(supplier: ProcurementSupplier): ProcurementSupplier {
  return Object.freeze({ ...supplier });
}

export function freezePurchaseOrder(order: PurchaseOrder): PurchaseOrder {
  return Object.freeze({
    ...order,
    lines: Object.freeze(order.lines.map((line) => Object.freeze({ ...line })))
  });
}

export function freezeGoodsReceipt(receipt: GoodsReceipt): GoodsReceipt {
  return Object.freeze({
    ...receipt,
    lines: Object.freeze(receipt.lines.map((line) => Object.freeze({ ...line })))
  });
}

export function freezeSupplierBill(bill: SupplierBill): SupplierBill {
  return Object.freeze({
    ...bill,
    lines: Object.freeze(bill.lines.map((line) => Object.freeze({ ...line })))
  });
}

export function freezeSupplierPayment(payment: SupplierPayment): SupplierPayment {
  return Object.freeze({ ...payment });
}

function clean(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}
