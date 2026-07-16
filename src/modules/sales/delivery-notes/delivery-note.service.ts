import type { DeliveryNote, DeliveryNoteFilters, DeliveryNoteId, DeliveryNoteListResult, CreateDeliveryNoteInput } from "./delivery-note.types";
import { formatDeliveryNoteNumber, isValidDeliveryNoteQuantity, matchesDeliveryNoteSearch, normalizeDeliveryNoteLines } from "./delivery-note.utils";

export class DeliveryNoteService {
  private readonly deliveryNotes = new Map<DeliveryNoteId, DeliveryNote>();
  private readonly now: () => string;

  constructor(options: { seed?: readonly DeliveryNote[]; now?: () => string } = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    options.seed?.forEach((note) => this.deliveryNotes.set(note.id, freezeDeliveryNote(note)));
  }

  replaceDeliveryNotes(notes: readonly DeliveryNote[]) {
    this.deliveryNotes.clear();
    notes.forEach((note) => this.deliveryNotes.set(note.id, freezeDeliveryNote(note)));
  }

  upsertDeliveryNote(note: DeliveryNote) {
    const frozen = freezeDeliveryNote(note);
    this.deliveryNotes.set(frozen.id, frozen);
    return frozen;
  }

  listDeliveryNotes(filters: DeliveryNoteFilters): DeliveryNoteListResult {
    const deliveryNotes = [...this.deliveryNotes.values()]
      .filter((note) => note.workspaceId === filters.workspaceId)
      .filter((note) => filters.includeArchived || note.status !== "archived")
      .filter((note) => !filters.status || filters.status === "all" || note.status === filters.status)
      .filter((note) => !filters.salesOrderId || note.salesOrderId === filters.salesOrderId)
      .filter((note) => !filters.companyId || filters.companyId === "all" || note.companyId === filters.companyId)
      .filter((note) => !filters.query || matchesDeliveryNoteSearch(note, filters.query))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    return Object.freeze({ deliveryNotes: Object.freeze(deliveryNotes), total: deliveryNotes.length });
  }

  getDeliveryNote(id: DeliveryNoteId, workspaceId: DeliveryNoteFilters["workspaceId"]) {
    const note = this.deliveryNotes.get(id);
    return note?.workspaceId === workspaceId ? note : undefined;
  }

  createDeliveryNote(input: CreateDeliveryNoteInput) {
    if (input.lines.some((line) => !isValidDeliveryNoteQuantity(line.quantityToDeliver))) {
      return Object.freeze({ deliveryNote: undefined, error: "La quantité à livrer doit être supérieure à zéro." });
    }
    const lines = normalizeDeliveryNoteLines(input.lines);
    if (!input.salesOrderId || !input.salesOrderNumber.trim()) return Object.freeze({ deliveryNote: undefined, error: "Sélectionnez une commande client." });
    if (!input.companyId || !input.companyName.trim()) return Object.freeze({ deliveryNote: undefined, error: "La société est obligatoire." });
    if (!input.warehouseId || !input.warehouseName.trim()) return Object.freeze({ deliveryNote: undefined, error: "Sélectionnez un entrepôt." });
    if (lines.length === 0) return Object.freeze({ deliveryNote: undefined, error: "Ajoutez au moins une quantité à livrer." });
    const timestamp = this.now();
    const deliveryNote = freezeDeliveryNote({
      ...input,
      id: `delivery-note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` as DeliveryNoteId,
      number: formatDeliveryNoteNumber(this.deliveryNotes.size + 1),
      status: "draft",
      lines,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    this.deliveryNotes.set(deliveryNote.id, deliveryNote);
    return Object.freeze({ deliveryNote });
  }

  updateDeliveryNote(note: DeliveryNote) {
    const existing = this.deliveryNotes.get(note.id);
    if (!existing || existing.status !== "draft") throw new Error("Seul un bon de livraison brouillon peut être modifié.");
    if (note.lines.some((line) => !isValidDeliveryNoteQuantity(line.quantityToDeliver))) throw new Error("La quantité à livrer doit être supérieure à zéro.");
    const updated = freezeDeliveryNote({ ...note, status: "draft", lines: normalizeDeliveryNoteLines(note.lines), updatedAt: this.now() });
    this.deliveryNotes.set(updated.id, updated);
    return updated;
  }
}

export function freezeDeliveryNote(note: DeliveryNote): DeliveryNote {
  return Object.freeze({ ...note, lines: Object.freeze(note.lines.map((line) => Object.freeze({ ...line }))) });
}
