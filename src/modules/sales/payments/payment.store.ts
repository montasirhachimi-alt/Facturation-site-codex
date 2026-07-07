import { PaymentService } from "./payment.service";
import { paymentSeed } from "./payments.seed";

export const paymentService = new PaymentService({ seed: paymentSeed });
