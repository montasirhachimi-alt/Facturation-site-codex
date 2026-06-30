# HicoPilot Decisions Log

## Purpose

Record important architectural and product decisions.

## Decision 001 — HicoPilot Is a Business Operating System

HicoPilot should evolve beyond a traditional ERP into a daily operating system for SMEs.

## Decision 002 — Architecture Before Features

Foundational architecture must be created before adding large new product features.

## Decision 003 — AI Is a Platform, Not a Chatbot

AI should support workflows, recommendations and business decisions across the product, not exist only as a standalone chat interface.

## Decision 004 — Dashboard Focuses on Decisions

The Dashboard should help owners understand priorities and make decisions, not only display static statistics.

## Decision 005 — Core Engine Before CRM

The Core Engine must exist before expanding into deeper CRM functionality, so future modules share common foundations.

## Decision 006 — Security Is an Independent Epic

Security requires dedicated planning and implementation, especially authentication, permissions, auditability and tenant isolation.

## Decision 007 — Documentation Is Lightweight During Development

Documentation should remain concise, current and easy to maintain while the product is still evolving quickly.

## Decision 008 — Workspace Context Is a State Bridge

Workspace Context exposes the active workspace state to future UI layers, but business logic remains inside WorkspaceService. React Context should delegate workspace loading, switching and snapshot refresh operations to the service layer instead of duplicating orchestration logic.

## Decision 009 — Dashboard Consumes Workspace Context Without Owning Logic

The Dashboard should become workspace-aware through a thin client bridge that consumes Workspace Context. Dashboard sections must not own workspace orchestration, widget runtime logic, preferences loading or business rules; those responsibilities remain in WorkspaceService and future platform services.

## Decision 010 — Widget Runtime Is the Dashboard Execution Boundary

Dashboard widgets should receive workspace, snapshot, preference, visibility, loading, error and permission context from a shared Widget Runtime. Individual widgets should not fetch workspace state independently or duplicate runtime concerns.
