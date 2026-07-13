# SPR-408B — Product Catalog Import & Export

## Executive Summary

SPR-408B adds professional Product Catalog import and export workflows for XLSX and CSV.

The feature is scoped strictly to canonical Product Catalog data. It does not import or modify Inventory balances, Warehouses, Stock movements, Purchasing, Sales Orders or accounting data.

## Supported Formats

- XLSX
- CSV

The implementation uses the existing `xlsx` dependency already present in the repository.

## Canonical Columns

Supported import/export fields:

- SKU
- Code-barres
- Nom
- Description courte
- Description
- Catégorie
- Marque
- Unité
- Prix d'achat
- Prix de vente
- TVA
- Devise
- Actif
- Notes

Required fields:

- SKU
- Nom

## Import Template

The Product workspace can download:

- `product-import-template.xlsx`
- `product-import-template.csv`

The XLSX template includes:

- Products sheet with headers and one example row
- Instructions sheet
- accepted units
- required fields
- VAT format
- duplicate policy explanation
- explicit note that stock quantities are not imported

## Column Mapping

The import dialog automatically maps common French and English headers, including:

- SKU
- Référence
- Reference
- Code-barres
- Barcode
- Nom
- Name
- Prix de vente
- Selling price
- TVA
- VAT

Users can manually adjust mapping before confirmation.

## Validation Rules

Validation covers:

- missing SKU
- missing name
- duplicate SKU inside the file
- duplicate SKU in the catalog
- duplicate barcode inside the file
- barcode conflict with another existing Product
- unsupported unit
- negative prices
- invalid VAT rate
- invalid currency
- excessive SKU/name length
- row count limit
- file size limit

Errors are reported by row with French messages and suggested corrections where useful.

## Duplicate Policies

Users must choose one duplicate policy before confirmation:

- `Arrêter sur doublon`
- `Ignorer les doublons`
- `Mettre à jour par SKU`

Existing Products are never overwritten silently. Barcode conflicts are handled separately from SKU matching.

## Preview Workflow

Import flow:

Upload
→ Parse
→ Map columns
→ Validate
→ Preview
→ Confirm
→ Persist
→ Refresh Product cache
→ Show result

The preview displays:

- total rows
- valid rows
- invalid rows
- new Products
- Products to update
- ignored rows
- first rows preview
- downloadable CSV error report

The dialog does not close on validation failure.

## Persistence And Transaction Behavior

Confirmed imports are applied server-side through the Product Catalog persistence boundary.

The server re-validates the submitted rows and mapping against the authenticated tenant scope before writing. Valid rows are applied inside one Prisma transaction for the current import size.

After success, the API returns a fresh Product Catalog snapshot and the client refreshes the local Product cache.

## Tenant Safety

The client cannot choose `companyId`.

Server import uses `requirePersistenceTenantScope()` and only reads/writes Products for the authenticated tenant. Update-by-SKU only targets Products inside that tenant.

## Export Scopes

The Product workspace supports:

- export all active Products
- export current filtered Products
- export selected Products

Supported formats:

- XLSX
- CSV

CSV exports include a UTF-8 BOM and semicolon separators for Excel compatibility.

## UI Integration

Product workspace actions now include:

- Modèle XLSX
- Modèle CSV
- Importer
- Exporter XLSX
- Tous actifs
- CSV
- Sélection

The primary `Nouveau produit` action remains distinct.

## Limits

- Maximum file size: 5 MB
- Maximum rows: 1,000
- Macro-enabled spreadsheets are rejected.
- Category names are matched to existing Product Categories; the import does not create new category records.

## Known Limitations

- No category creation during import.
- No stock quantity import.
- No inventory balance import.
- No warehouse import.
- No stock movement import.
- No async/background import queue.
- Manual authenticated QA must be performed with the controlled Product/Inventory profile.
