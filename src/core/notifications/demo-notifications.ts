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
    actionTarget: { moduleId: "invoices", route: "/factures" },
    metadata: { count: 8 }
  },
  {
    id: "demo-critical-stock",
    title: "Stock critique",
    message: "12 produits doivent être réapprovisionnés prochainement.",
    type: "error",
    priority: "critical",
    category: "stock",
    moduleId: "products",
    createdAt: "2026-06-29T08:45:00.000Z",
    actionLabel: "Voir le stock",
    actionTarget: { moduleId: "products", route: "/stock" },
    metadata: { count: 12 }
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
    actionLabel: "Voir les utilisateurs",
    actionTarget: { moduleId: "users", route: "/utilisateurs" }
  },
  {
    id: "demo-ai-recommendation",
    title: "Recommandation IA disponible",
    message: "Une nouvelle recommandation est prête dans l'assistant IA.",
    type: "ai",
    priority: "normal",
    category: "ai",
    moduleId: "ai_assistant",
    createdAt: "2026-06-29T08:10:00.000Z",
    actionLabel: "Ouvrir Assistant IA",
    actionTarget: { moduleId: "ai_assistant", route: "/assistant-ia" }
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
    actionTarget: { moduleId: "payments", route: "/paiements" }
  }
];

demoNotifications.forEach(registerNotification);
