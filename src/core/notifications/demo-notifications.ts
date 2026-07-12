import { registerNotification } from "./notification.registry";
import type { NotificationInput } from "./notification.types";

export const demoNotifications: NotificationInput[] = [
  {
    id: "demo-overdue-invoices",
    title: "Factures en retard",
    message: "8 factures dépassent leur échéance de paiement.",
    type: "warning",
    priority: "high",
    category: "finance",
    moduleId: "invoices",
    createdAt: "2026-06-29T09:00:00.000Z",
    actionLabel: "Voir les factures",
    actionTarget: { moduleId: "invoices", route: "/sales/invoices" },
    metadata: { count: 8 }
  },
  {
    id: "demo-new-device-login",
    title: "Connexion depuis un nouvel appareil",
    message: "Une connexion récente nécessite une vérification de sécurité.",
    type: "security",
    priority: "high",
    category: "security",
    moduleId: "users",
    createdAt: "2026-06-29T08:30:00.000Z",
    actionLabel: "Ouvrir les paramètres",
    actionTarget: { moduleId: "settings", route: "/parametres" }
  },
  {
    id: "demo-payment-received",
    title: "Paiement reçu",
    message: "Un nouveau paiement client a été enregistré.",
    type: "success",
    priority: "normal",
    category: "finance",
    moduleId: "payments",
    createdAt: "2026-06-29T07:55:00.000Z",
    actionLabel: "Voir les paiements",
    actionTarget: { moduleId: "payments", route: "/sales/payments" }
  }
];

demoNotifications.forEach(registerNotification);
