# HicoPilot Master Document

## Vision

HicoPilot is a Business Operating System for small and medium businesses.

See: `docs/01_PROJECT_VISION.md`

## Mission

Help SMEs run their business from one intelligent, secure and modern platform.

## Product Philosophy

HicoPilot should be simple, fast, proactive and decision-oriented. It should help business owners know what happened, what matters now and what to do next.

## Architecture Overview

HicoPilot is built on Next.js, TypeScript and a modular application structure. The current product foundation includes dashboard, business modules, PDF templates, RBAC concepts and a Prisma schema.

See: `docs/PROJECT_AUDIT.md`

## Core Engine

The Core Engine is the shared foundation for future search, commands, notifications, activity, widgets, favorites, recent items, preferences and AI platform capabilities.

Current implementation: `src/core/`

## Business Modules

Current Alpha modules include Dashboard, CRM, Sales, Product Catalog, Inventory and Procurement operational workspaces. Legacy purchases, suppliers, stock, cash, statistics, HR and other demo-era surfaces remain hidden unless activated through platform profiles.

## AI Platform

AI will be treated as a product platform layer. It should support workflows, insights and recommendations across HicoPilot.

See: `docs/05_AI.md`

## Security Vision

Security will become an independent epic covering authentication, authorization, tenant isolation, auditability and data protection.

## Current Project Status

See: `docs/02_PROJECT_STATUS.md`

## Current Sprint

SPR-423 — Procurement Operational Workspace.

## Current Task

Operational purchasing lifecycle: Supplier -> Purchase Order -> Goods Receipt -> Inventory Update.

## Next Task

Continue with the next roadmap sprint after Procurement QA.

## Roadmap

See: `docs/04_ROADMAP.md`

## Architectural Decisions

See: `docs/03_DECISIONS_LOG.md`

## Development Rules

See: `docs/00_ENGINEERING_CHARTER.md`

## Long-Term Vision

HicoPilot will evolve into a professional commercial platform that combines business operations, executive visibility, secure workflows and AI-powered assistance for SMEs.
