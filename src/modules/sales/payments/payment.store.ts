import { PaymentService } from "./payment.service";
import { paymentSeed } from "./payments.seed";

export const paymentStoreEventName = "hicopilot-payments-updated";
export const paymentService = new PaymentService({ seed: paymentSeed });

export function notifyPaymentStoreUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(paymentStoreEventName));
}

export function subscribeToPaymentStore(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(paymentStoreEventName, listener);
  return () => window.removeEventListener(paymentStoreEventName, listener);
}
