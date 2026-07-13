# SPR-408C — Shared Import / Export Framework

## Executive Summary

SPR-408C extracts the Product Catalog import/export mechanics into a reusable platform framework at `src/platform/import-export/`.

Product Catalog remains the first consumer. Its visible workflow is unchanged:

- XLSX/CSV templates
- file parsing
- automatic column mapping
- row-level validation
- duplicate policies
- preview statistics
- confirmed server-side import
- error report download
- XLSX/CSV export

The architecture now allows future modules to provide metadata and business-specific parsing/validation without duplicating import/export infrastructure.

## Platform Architecture

The framework is platform-owned and module-agnostic.

```text
ImporterDefinition / ExporterDefinition
        ↓
Mapping / Validation / Preview / Template / CSV / XLSX helpers
        ↓
Module-specific adapter
        ↓
Existing module dialog / API / repository
```

The platform never imports Product, Customer, Inventory, Purchasing, HR or Accounting internals. Business modules own their entity definitions, persistence callbacks and domain validation.

## ImporterDefinition

`ImporterDefinition` describes an importable entity:

- `identifier`
- `entityLabel`
- `supportedFormats`
- `columns`
- `duplicatePolicySupport`
- `identityField`
- `sampleRow`
- `instructions`
- `parseRow`
- `validateRow`
- `resolveExisting`
- `getExistingId`
- `duplicateChecks`

The platform uses this definition to produce a deterministic preview. It does not decide business identity by itself; modules provide `resolveExisting` and duplicate checks.

## ExporterDefinition

`ExporterDefinition` describes an exportable entity:

- `identifier`
- `entityLabel`
- `supportedFormats`
- `columns`
- `filename`
- column formatters

The shared export engine converts entities into labeled rows while modules retain control of field formatting.

## Validation Engine

The framework provides:

- required-column validation
- reusable issue creation
- generic required, number, enum and max-length validators
- module-specific validation hooks through `validateRow`

Product keeps its previous validation rules for SKU, name, barcode, unit, purchase price, selling price, VAT, currency and field length.

## Mapping Engine

`createDefaultImportMapping()` maps file headers to fields using module-provided aliases.

Product keeps French, English and legacy aliases such as `Référence`, `SKU`, `Nom`, `Code-barres`, `Prix de vente`, `TVA` and `Unité`.

## Preview Engine

`buildImportPreview()` produces:

- total rows
- valid rows
- invalid rows
- new records
- records to update
- ignored rows
- parsed rows
- issues

Product maps the generic counters back to its public `newProducts` and `productsToUpdate` fields to preserve existing behavior.

## Template Engine

The framework generates template rows and instruction rows from the importer definition.

Product templates still contain Product master data only. Inventory quantities, Warehouses and Stock movements remain excluded.

## CSV Helper

The framework provides:

- UTF-8 BOM CSV export
- semicolon-separated output for Excel compatibility
- CSV escaping
- CSV parsing with semicolon/comma detection
- quoted value support

## XLSX Helper

The framework provides:

- XLSX parsing through the existing `xlsx` dependency
- XLSX writing for templates and exports
- multi-sheet output for data and instructions
- macro rejection through the existing file validation path

## Duplicate Policies

Supported active policies:

- `stop`
- `ignore`
- `update`

`merge` remains a future placeholder only. The platform does not merge business records.

## Product Migration

Product Catalog now defines:

- `PRODUCT_IMPORTER_DEFINITION`
- `PRODUCT_EXPORTER_DEFINITION`

The existing Product import dialog, toolbar, persistence API and repository remain unchanged from the user perspective.

## Validation

Completed during SPR-408C:

- `npm run validate:runtime` — passed, 100/100
- `npm run typecheck` — passed

Additional validation adds coverage for:

- generic import mapping
- generic preview classification
- duplicate policies
- CSV parser quoted values
- export rows
- error report rows
- Product import/export compatibility

## Known Limitations

- No registry of import/export definitions is exposed yet; modules import their own definitions directly.
- No server-side generic import executor has been introduced; persistence remains module-owned.
- `merge` duplicate policy is reserved for a future sprint.
- Product remains the only active consumer of the framework.

## Confirmation

SPR-408C changes architecture only.

- Product behavior unchanged.
- Inventory unchanged.
- Sales workflows unchanged.
- Current Alpha profile remains `alpha.crm-sales`.
- No Runtime, Prisma, persistence, authentication or permission changes were introduced.
