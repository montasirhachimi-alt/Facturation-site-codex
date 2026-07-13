import { roundDocumentAmount } from "./document-calculation";

export function calculateTaxAmount(base: number, rate = 0) {
  return roundDocumentAmount(base * (rate / 100));
}
