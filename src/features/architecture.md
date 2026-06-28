# Architecture fonctionnelle HicoPilot

## Modules

- Pilotage : tableau de bord, statistiques, paiements.
- Ventes : devis, factures, proformas, avoirs, commandes, livraisons.
- Achats : factures fournisseurs, paiements, impact stock.
- Stock : produits, services, catégories, mouvements et alertes.
- CRM : prospects, pipeline, relances, visites, objectifs et primes.
- Caisse : recettes, dépenses, charges, solde et bilan simplifié.
- Documents : PDF, impressions, rapports.
- Assistant IA : couche préparée pour questions métier.

## Multi-tenant

Chaque table métier porte un `companyId`. Les requêtes applicatives doivent passer par un contexte `TenantScope`, puis utiliser `tenantWhere` ou `assertTenantAccess`.

## Rôles

- `SUPER_ADMIN`
- `COMPANY_ADMIN`
- `SALES`
- `ACCOUNTANT`
- `WAREHOUSE`
- `READ_ONLY`

## Étapes suivantes

1. Brancher PostgreSQL ou Supabase.
2. Ajouter l'authentification et les sessions.
3. Implémenter les formulaires CRUD par module.
4. Connecter les conversions de documents.
5. Ajouter les tests d'isolation multi-tenant.
