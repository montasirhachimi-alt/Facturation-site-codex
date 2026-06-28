# HCP-000 Project Technical Audit

## 1. Executive Summary

HicoPilot currently has a strong product foundation: a modern Next.js application, a broad multi-company Prisma schema, a consistent HICOTECH visual identity, protected navigation, RBAC concepts, commercial modules, stock modules, payments/statistics views, PDF generation work, and a first HR domain.

The most important architectural gap is that the application is not yet production-connected. The Prisma PostgreSQL schema exists, but the runtime modules mostly consume `src/lib/demo-data.ts`, browser `localStorage`, and client-side state. This makes the current app valuable as an advanced functional prototype, but not yet safe as a commercial system of record.

The next development phase should prioritize stability, data integrity, and security before adding large new modules. HicoPilot should move gradually from demo/local state to server-backed, tenant-scoped persistence, with authenticated server actions or API routes enforcing RBAC and company isolation.

## 2. Architecture Overview

### Folder Organization

- `src/app`: Next.js App Router pages, login page, protected ERP route group, logout route, and module pages.
- `src/components`: UI shell, sidebar/topbar, reusable controls, dashboard widgets, business modules, PDF previews, and feature-heavy client components.
- `src/components/pdf-templates`: specialized PDF templates and shared PDF layout pieces.
- `src/lib`: authentication helpers, RBAC matrix, demo data, formatting, PDF generation, tenant helpers, product utilities, metric calculations, and shared TypeScript types.
- `src/features`: currently contains architectural documentation rather than active feature implementation.
- `prisma`: PostgreSQL schema for multi-company ERP data.
- `docs`: early HicoPilot documentation placeholders plus this audit.
- `public`: static assets, including the HICOTECH logo.

### Overall Architecture

The application uses the Next.js App Router with a server-rendered route shell and many client-side business modules. The layout flow is:

1. `src/middleware.ts` checks for a session cookie and redirects unauthenticated users.
2. `src/app/(erp)/layout.tsx` reads the current user with `getCurrentUser()`.
3. `src/components/erp-shell.tsx` renders the sidebar, topbar, and page content.
4. Feature pages pass demo data into client modules.

This architecture is clear and easy to navigate. The main limitation is that authorization and data integrity are not enforced at a persistent data layer yet.

### Project Conventions

- French UI labels and business vocabulary.
- HICOTECH design tokens in Tailwind.
- Server pages used as thin wrappers around client modules.
- Large feature modules often keep their own form, table, modal, filtering, pagination, and actions in one file.
- Data types are centralized in `src/lib/types.ts`, but they do not fully match the Prisma schema.

## 3. Technology Stack

| Area | Current Technology |
| --- | --- |
| Framework | Next.js 15 App Router |
| Language | TypeScript |
| UI | React 19 |
| Styling | Tailwind CSS |
| Icons | lucide-react |
| Charts | Recharts |
| Database schema | Prisma |
| Intended database | PostgreSQL via `DATABASE_URL` |
| Runtime data today | Demo data, client state, browser `localStorage` |
| Authentication | Custom cookie/session helpers |
| Authorization | Static RBAC matrix in `src/lib/rbac.ts` plus middleware/sidebar filtering |
| PDF | jsPDF and custom PDF template helpers |
| Excel/CSV | xlsx and custom CSV utilities |
| Validation | zod dependency present, limited visible usage |
| Deployment target | Next.js compatible deployment, likely Vercel |

## 4. Modules Overview

### Login and Session

- Purpose: Authenticate users into the ERP.
- Current implementation: Client-side login form checks demo/stored users, hashes password in the browser, writes a base64 session cookie, then redirects to dashboard.
- Dependencies: `src/components/login-form.tsx`, `src/lib/demo-data.ts`, `src/lib/auth.ts`, `src/middleware.ts`.
- Quality: Useful for demo, not production-grade.

### Dashboard

- Purpose: Present executive KPIs, charts, stock alerts, sales activity, and rankings.
- Current implementation: Server page imports demo stats and renders dashboard cards/charts.
- Dependencies: `dashboard-widgets`, `sales-chart`, `product-ranking`, `demo-data`.
- Quality: Good visual foundation, needs database-backed metrics.

### Devis

- Purpose: Create, edit, search, export, print, convert quotes.
- Current implementation: Client module with line-item editing and product reference assistance.
- Dependencies: `quotes-module`, `demo-data`, `product-tools`, PDF helpers.
- Quality: Functional prototype, but persistence and stock/accounting implications need server enforcement.

### Factures

- Purpose: Manage invoices, payments, PDF/print/export, stock effects.
- Current implementation: Client module using demo invoices/products and local product tooling.
- Dependencies: `invoices-module`, `demo-data`, `product-tools`, PDF helpers.
- Quality: Strong UI prototype, needs reliable persistence, payment history, and transaction safety.

### Bons de livraison

- Purpose: Manage delivery notes with client, delivered lines, summary, PDF/print.
- Current implementation: Dedicated delivery-note module and Prisma models exist.
- Dependencies: `delivery-notes-module`, `demo-data`, PDF helpers.
- Quality: Better than generic placeholder; needs server-backed workflow.

### Produits & Stock

- Purpose: Product catalog, stock levels, movements, import/export, critical alerts.
- Current implementation: Large client module with Excel/CSV features and browser product persistence.
- Dependencies: `stock-module`, `product-tools`, `xlsx`, `demo-data`.
- Quality: Feature-rich but oversized and not database-backed.

### Clients

- Purpose: Client CRUD, search, history, sold/paid/outstanding totals.
- Current implementation: Client module using demo clients/documents.
- Dependencies: `clients-module`, `demo-data`.
- Quality: Useful and coherent, but financial totals should be computed from persisted documents.

### Fournisseurs

- Purpose: Supplier CRUD, purchase relationships, balance/history.
- Current implementation: Client module using demo suppliers and purchase invoices.
- Dependencies: `suppliers-module`, `demo-data`.
- Quality: Solid prototype, needs DB persistence.

### Achats / Factures d'achat

- Purpose: Purchase invoice tracking, supplier relation, stock-in behavior.
- Current implementation: Client module with product lines and totals.
- Dependencies: `purchases-module`, `demo-data`, `product-tools`.
- Quality: Operational UI, but stock updates should be transactional on the server.

### Caisse

- Purpose: Cash entries, outflows, categories, balances.
- Current implementation: Client module with filtering, add/edit/delete patterns.
- Dependencies: `cash-module`, `demo-data`.
- Quality: Good foundation, needs durable audit trail and permission enforcement.

### Statistiques

- Purpose: Business metrics, period filters, detail views, export.
- Current implementation: `statistics-module` calculates metrics from demo invoices, purchases, cash entries, products, and clients.
- Dependencies: `business-metrics`, `recharts`, demo data.
- Quality: Improved beyond placeholder, but still not database-backed.

### Suivi paiements

- Purpose: Track invoice payment status, reminders, receipts, exports.
- Current implementation: `payments-tracking-module` derives tracking rows from demo invoices and clients.
- Dependencies: `demo-data`, PDF/export utilities.
- Quality: Functional client-side view, needs persistent payments/reminders.

### Documents PDF

- Purpose: Generate and preview commercial/RH documents.
- Current implementation: Custom PDF engine and templates exist, including specialized commercial and HR templates.
- Dependencies: `src/lib/pdf.ts`, `src/components/pdf-templates`, `jspdf`.
- Quality: Good direction. Needs visual regression tests and one authoritative document-generation boundary.

### Rapports

- Purpose: Reporting area.
- Current implementation: Still partly served by the generic dynamic module page.
- Dependencies: `DataTable`, `demo-data`.
- Quality: Placeholder-level compared with dedicated modules.

### Assistant IA

- Purpose: Future AI assistant entry point.
- Current implementation: Static prompt buttons and explanatory UI.
- Dependencies: None beyond UI components.
- Quality: Good placeholder for AI direction, no AI integration yet.

### Paramètres

- Purpose: Company profile, users/roles, numbering, PDF/printing settings.
- Current implementation: Dedicated settings module exists, with user/company/PDF setting concepts.
- Dependencies: `settings-module`, `demo-data`, user storage.
- Quality: Important foundation, but settings persistence is not centralized in the database.

### Utilisateurs

- Purpose: Manage users, roles, status, passwords.
- Current implementation: Client module using demo users and browser storage.
- Dependencies: `users-module`, `auth`, `rbac`, `demo-data`.
- Quality: Useful for demo; high security risk until moved server-side.

### Ressources Humaines

- Purpose: Employees, contracts, attendance, absences, leave, salaries, advances, RH documents.
- Current implementation: HR dashboard, employee module, generic HR record module, Prisma models, and PDF templates.
- Dependencies: `hr-dashboard`, `hr-employees-module`, `hr-records-module`, `demo-data`, PDF helpers.
- Quality: Broad foundation, but module depth varies and persistence is not active.

## 5. Routing

### Structure

- Public login route: `/`.
- Logout route: `/logout`.
- Protected ERP group: `src/app/(erp)`.
- Main pages: `/dashboard`, `/devis`, `/factures`, `/livraisons`, `/achats`, `/stock`, `/clients`, `/fournisseurs`, `/caisse`, `/statistiques`, `/paiements`, `/pdf`, `/parametres`, `/utilisateurs`.
- HR pages: `/rh/employes`, `/rh/contrats`, `/rh/presences`, `/rh/absences`, `/rh/conges`, `/rh/salaires`, `/rh/avances`, `/rh/documents`.
- Fallback module route: `/(erp)/[module]`.
- Access denied route: `/acces-refuse`.

### Navigation Flow

Navigation is driven by `src/components/sidebar.tsx`. The sidebar groups modules by business area and filters visible links with `canViewModule()`. This is a good user-experience layer for RBAC.

### Protected Routes

`src/middleware.ts` redirects unauthenticated users to `/` and blocks unauthorized module paths by role. This is useful, but it relies on a client-created session cookie and does not validate the session against a server-side user record.

## 6. Database

### Current Schema

The Prisma schema is broad and multi-company aware. Main entities include:

- `Company`
- `User`
- `Client`
- `Supplier`
- `Category`
- `Product`
- `Document`
- `DocumentLine`
- `Payment`
- `DeliveryNote`
- `DeliveryNoteLine`
- `PurchaseInvoice`
- `PurchaseInvoiceLine`
- `CashEntry`
- `Expense`
- `Employee`
- `EmployeeContract`
- `Attendance`
- `HrLeave`
- `SalarySlip`
- `SalaryAdvance`
- `HrDocument`
- `StockMovement`
- `Reminder`

### Relationships

Most business records are linked to `Company` through `companyId`, which supports multi-company isolation. Commercial documents link to clients, products, lines, and payments. Purchase invoices link to suppliers and products. HR records link to employees and companies. Stock movements link to products and companies.

### Scalability Observations

Strengths:

- Company-level indexes are present across many models.
- Unique constraints exist for company-specific references such as product reference and document number.
- Core commercial, stock, cash, HR, and reminder entities are represented.

Concerns:

- There is no visible active Prisma client usage in `src`.
- TypeScript domain types and Prisma model fields diverge in naming and casing.
- Document types are generic, which is flexible, but domain-specific validation must be enforced outside the schema.
- Monetary values use Prisma `Decimal`, while UI types use JavaScript `number`; conversion rules need to be standardized.
- No migration history was reviewed as part of this audit.

## 7. Authentication

### Flow

1. Login page renders `LoginForm`.
2. Login reads users from browser storage or demo data.
3. Password is hashed in the browser with SHA-256 and compared to stored hash.
4. Login writes a base64 JSON cookie named `hicotech-session`.
5. Middleware reads the cookie and applies route-level RBAC.
6. ERP layout reads the same cookie and passes the user to the shell/sidebar.

### Roles

The RBAC matrix defines:

- `SUPER_ADMIN`
- `COMPANY_ADMIN`
- `SALES`
- `STOCK_MANAGER`
- `ACCOUNTANT`
- `HR`
- `WAREHOUSE`
- `READ_ONLY`

### Permissions

Permission actions are:

- `view`
- `create`
- `edit`
- `delete`
- `export`
- `print`
- `approve`

Permission modules include dashboard, quotes, invoices, delivery notes, purchases, stock, clients, suppliers, cash, expenses, payments, reports, PDF documents, HR, settings, users, and assistant.

### Security Observations

- Session cookies are not cryptographically signed.
- The active login flow trusts browser-side user storage.
- Password hashing uses raw SHA-256 rather than a password hashing algorithm such as bcrypt/argon2.
- Route-level RBAC exists, but action-level server enforcement is not yet present.
- Multi-company isolation is modeled but not enforced through database queries yet.

This is acceptable for a prototype, but it is the highest priority risk before HicoPilot can become a commercial product.

## 8. Components

### Reusable Components

- `Sidebar`
- `Topbar`
- `ErpShell`
- `SectionHeader`
- `StatCard`
- `SalesChart`
- `ProductRanking`
- `DataTable`
- `FormModal`
- `SearchBar`
- `Filters`
- `EmptyState`
- `ConfirmDeleteDialog`
- `HicotechLogo`
- PDF layout/templates

### Duplicate or Repeated Patterns

Several feature modules implement their own versions of:

- action buttons
- pagination controls
- form fields
- modal layouts
- table rows
- status badges
- empty/loading/error states
- CSV export
- search/filter logic

Examples of large modules:

- `stock-module.tsx`: 836 lines
- `pdf.ts`: 860 lines
- `delivery-notes-module.tsx`: 601 lines
- `invoices-module.tsx`: 598 lines
- `settings-module.tsx`: 471 lines
- `quotes-module.tsx`: 465 lines
- `clients-module.tsx`: 424 lines
- `purchases-module.tsx`: 406 lines

### Components That Should Become Shared

- `PaginationControls`
- `ActionButton`
- `StatusBadge`
- `MoneyCell`
- `DateCell`
- `FormField`
- `SelectField`
- `EntityTable`
- `ExportMenu`
- `PermissionGate`
- `ModuleToolbar`

These should be extracted incrementally, not through a rewrite.

## 9. Code Quality

| Area | Score | Notes |
| --- | ---: | --- |
| Readability | 7/10 | Naming is mostly clear, UI code is easy to follow, but large files reduce scanability. |
| Maintainability | 6/10 | Business features are understandable, but repeated CRUD logic and demo/local state increase future change cost. |
| Modularity | 6/10 | Modules are separated by file, but shared behavior is often duplicated inside feature components. |
| Naming Consistency | 6/10 | UI names are coherent, but Prisma fields, TypeScript types, statuses, and labels differ in several places. |
| Security Posture | 4/10 | RBAC concepts exist, but authentication/session/password storage are prototype-grade. |
| Data Integrity | 4/10 | Schema is good, but runtime operations are not transactional or database-backed. |
| UI Consistency | 7/10 | HICOTECH styling is consistent overall, with some custom per-module controls. |

## 10. Strengths

- Clear product direction and business module coverage.
- Modern Next.js/React/TypeScript foundation.
- Strong HICOTECH visual identity and Tailwind design tokens.
- Multi-company Prisma schema already models the future product well.
- RBAC module and sidebar filtering provide a good permission foundation.
- Many modules are more than placeholders and already demonstrate intended workflows.
- PDF generation has moved toward dedicated templates instead of screenshot-based output.
- HR is represented in both UI and schema, supporting the long-term HicoPilot vision.
- Existing reusable components provide a base for future consolidation.

## 11. Weaknesses

- Runtime data is mostly demo/local state instead of PostgreSQL.
- Authentication is client-side and not production-secure.
- Session cookies are unsigned and can be forged if a user understands the format.
- Password hashing is not suitable for production credential storage.
- RBAC is mostly route/sidebar-level, not consistently enforced at mutation/export/action boundaries.
- Feature modules are large and duplicate similar table/form/action logic.
- Some generic module routes and placeholder-style pages remain.
- Type definitions and Prisma schema are not fully aligned.
- Monetary calculations use UI `number` values in many places; database uses `Decimal`.
- No clear server-side service/repository layer exists yet.

## 12. Technical Debt

### Code Duplication

- CRUD table patterns repeated across clients, suppliers, purchases, invoices, quotes, cash, HR, and stock.
- Form fields and action buttons are duplicated in many modules.
- Export logic appears in multiple modules instead of one shared utility.

### Oversized Files

The largest files are understandable but difficult to maintain. They combine data transformation, UI rendering, forms, modals, filters, pagination, and actions.

Highest-risk oversized files:

- `src/lib/pdf.ts`
- `src/components/stock-module.tsx`
- `src/components/delivery-notes-module.tsx`
- `src/components/invoices-module.tsx`
- `src/components/settings-module.tsx`

### Complex Components

The main business modules are mostly self-contained client components. This is fast to build but can become fragile as persistence, permissions, validations, and workflows become real.

### Inconsistent Patterns

- Some pages use shared components; others define local table/action/form pieces.
- Some modules enforce permissions in the UI; server-side enforcement is not visible.
- Status values vary between French labels, lowercase labels, uppercase enums, and Prisma enum values.

### Architecture Issues

- No visible database access layer.
- No visible server action/API boundary for mutations.
- Demo data is treated like active data in many pages.
- Client storage is used for important business entities.

## 13. Performance

Potential bottlenecks:

- Large client modules increase JavaScript payload and hydration cost.
- `xlsx`, `jspdf`, and charting code can add weight if imported into always-loaded client bundles.
- Client-side filtering/pagination will not scale to thousands of records.
- Metrics are calculated from full in-memory arrays, not paginated or aggregated by the database.
- PDF generation in a large shared file could become costly if loaded widely.
- Browser `localStorage` state can become slow and unreliable as product/document volume grows.

No performance optimizations should be implemented until the persistence and security boundaries are clarified.

## 14. UI Consistency

### Colors

The app consistently uses the HICOTECH palette:

- Primary blue: `#0D6EFD`
- Navy: `#0A1E3F`
- Light blue: `#E6F2FF`
- Dark sidebar/page/card colors

### Typography

Montserrat is used for headings and Inter for body text. This is consistent with the brand direction.

### Buttons

Buttons are visually coherent, but button implementations are repeated. Shared button variants would reduce drift.

### Forms

Forms generally follow the same rounded, bordered, HICOTECH-styled pattern. Some modules define local field components instead of using shared form inputs.

### Tables

Tables use similar header colors and row spacing, but they are implemented separately in many modules. A stronger shared table abstraction would improve consistency.

### Cards and Layout

The dark mode and card styling are consistent overall. The sidebar is stable, responsive, and RBAC-aware.

### Inconsistencies

- Generic `DataTable` still contains buttons such as `Trier`, `Export`, and `Voir` without module-specific behavior.
- Dedicated modules have real actions, but action styling varies slightly.
- Some pages remain informational or placeholder-like compared with fully built modules.

## 15. AI Readiness

### Current Readiness

HicoPilot is conceptually ready for AI, but technically early. The application has:

- A clear business domain model.
- Multi-company concepts.
- RBAC concepts.
- Commercial, stock, finance, and HR entities.
- An Assistant IA page reserved for future use.

The main blockers are data access, permission enforcement, and auditability.

### Suggested AI Integration Points

- Business assistant for questions over invoices, stock, payments, and HR.
- Payment-risk summaries and client follow-up suggestions.
- Stock criticality explanations and reorder suggestions.
- Quote/invoice drafting assistance from product references.
- PDF/document wording assistance.
- HR absence and payroll anomaly detection.
- Dashboard narrative summaries.

### AI Safety Requirements

- AI must only access data through tenant-scoped server APIs.
- AI must respect RBAC permissions.
- AI should suggest actions, not directly mutate business records.
- Every AI-generated business action should require user confirmation.
- AI outputs should be logged for auditability when used in business workflows.

## 16. Refactoring Opportunities

Do not implement these yet. Recommended opportunities for future sprints:

1. Introduce a server-side data access layer using Prisma and tenant scoping.
2. Add signed sessions and production password hashing.
3. Create shared CRUD primitives from existing repeated patterns.
4. Align TypeScript domain types with Prisma entities through mapping utilities.
5. Split large modules into container, table, form, detail, and utility files.
6. Centralize exports for CSV, Excel, and PDF.
7. Add a reusable `PermissionGate` for action visibility.
8. Move calculation-heavy statistics to server/database aggregation.
9. Add tests around authentication, RBAC, stock movements, invoices, and payments.
10. Keep the UI unchanged while improving internal structure.

## 17. Recommended Sprint Roadmap

### Sprint 1: Security and Data Foundation

- Replace client-created sessions with signed server sessions.
- Move user authentication to the database or a server-managed user store.
- Use production-grade password hashing.
- Create a Prisma client wrapper.
- Add tenant-scoped query helpers.
- Keep the UI unchanged.

### Sprint 2: Database-Backed Core Modules

- Connect clients, suppliers, products, and users to the database first.
- Preserve current screens and behavior.
- Add server-side validation and action-level RBAC.
- Introduce optimistic UI only after persistence is reliable.

### Sprint 3: Commercial Workflows

- Connect quotes, invoices, payments, delivery notes, and purchase invoices.
- Make stock movements transactional.
- Standardize document numbering.
- Ensure PDF generation uses persisted company settings.

### Sprint 4: Shared Components and Maintainability

- Extract repeated table, form, pagination, action, export, and status components.
- Reduce the largest modules gradually.
- Add integration tests for the most critical flows.

### Sprint 5: Reporting and AI Readiness

- Move statistics to server/database aggregations.
- Add permission-aware reporting APIs.
- Introduce AI context boundaries and non-mutating assistant features.

## 18. Highest Priorities Before New Features

1. Secure authentication and sessions.
2. Move critical business data from demo/local state to tenant-scoped database persistence.
3. Enforce RBAC and company isolation server-side for every business action.

## 19. Critical Risks

- A forged session cookie could bypass role identity because sessions are not signed.
- Browser-stored users/products are not reliable as business records.
- Data isolation is modeled but not enforced through actual database queries.
- Stock, payment, and invoice operations are not transactional.
- Adding more modules now would increase maintenance cost before the foundation is secure.

## 20. Conclusion

HicoPilot has a promising foundation and a coherent product direction. The UI, module coverage, Prisma schema, and RBAC concepts show strong progress. The immediate engineering goal should be to convert the prototype into a reliable commercial foundation without changing the user experience: secure the auth layer, activate the database layer, and enforce tenant-safe server-side business operations.
