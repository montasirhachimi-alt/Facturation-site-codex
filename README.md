# HicoPilot

Plateforme SaaS de gestion multi-entreprises pour la facturation, les achats, le stock, la caisse, le CRM commercial, les rapports et les documents PDF.

## Architecture

- `src/app` : routes Next.js, écran de connexion, application protégée.
- `src/components` : composants UI réutilisables, navigation, tableaux, graphiques et previews PDF.
- `src/features` : logique métier par domaine.
- `src/lib` : données de démonstration, sécurité multi-tenant, formatage, génération PDF.
- `prisma/schema.prisma` : modèle PostgreSQL multi-tenant avec isolation par `companyId`.

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvrir `http://localhost:3000`.

## Identité visuelle

La base reprend la charte HICOTECH fournie pour l'identité visuelle :

- Bleu principal `#0D6EFD`
- Bleu foncé `#0A1E3F`
- Bleu clair `#E6F2FF`
- Gris clair `#F5F7FA`
- Succès `#2ECC71`
- Orange `#FF8C00`
- Rouge `#E74C3C`
- Texte `#333333`
- Titres Montserrat, texte Inter
