# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server on localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint (scripts/ is ignored)
```

## Architecture

This is a multi-tenant art collection management application built with Next.js 16 (App Router) using React 19. The Supabase project ref is `acrvteypohtcmywoiudv`. Deployed on Vercel (project `duarte`, auto-deploys on push to main; env vars are configured there).

### Backend Services
- **Supabase**: Authentication (email/password + Google OAuth via `/auth/callback`) and PostgreSQL database
- **Cloudflare R2**: Image/document storage (S3-compatible)

### Multi-tenancy (workspaces)

The tenant is a **workspace** (`workspaces`, `workspace_members` with roles owner/editor/viewer, `workspace_invites`). Every domain table carries `workspace_id` and is protected by RLS policies built on `is_workspace_member()` / `can_edit_workspace()` (security-definer helpers). A user's personal workspace is created lazily by `ensure_personal_workspace()` (which also seeds starter categories via `seed_workspace_defaults()`); invites are accepted at `/invite/[token]`. The active workspace is stored in the `duarte-workspace` cookie; the sidebar has a switcher. Workspace settings (Settings page, owner-only): accession prefix for auto-numbering, default (domestic) currency, categories CRUD.

**Mandatory pattern for server actions and pages:**
- Use `getWorkspaceContext()` from `@/lib/workspace` — never `createClient()` directly (login/OAuth callback are the only exceptions).
- List queries filter `.eq('workspace_id', ctx.workspaceId)`. By-id reads rely on RLS (no workspace filter, so cross-workspace deep links resolve).
- Mutations call `requireEdit(ctx)` first (viewers are read-only); inserts set `workspace_id` — including junction tables.

### Database

- Migrations live in `supabase/migrations/` (checked in; applied via Supabase MCP `apply_migration` or `npx supabase db push`).
- Generated types in `lib/database.types.ts` (regenerate after schema changes); both Supabase clients are typed with them.
- RLS isolation test: `supabase/tests/rls_test.sql` — run it (it rolls back) after any policy change.
- Core tables: `objects` (lifecycle `status` incl. `incoming` — see `OBJECT_STATUSES` in `lib/constants.ts`), `artists`, `contacts`, hierarchical `locations`, `categories`, `groups` (surfaced as ordered "Lists"), `object_media`, `object_dimensions`.
- Financial/registrar: `acquisitions`, `disposals`, `valuations`, `insurance_policies`, `expenses`, `loans`, `consignments`, `shipments` (+ `object_*` junctions), `provenance_events`, `exhibitions`, `publications`, `condition_reports`, `conservation_treatments`, `object_components`, `documents`/`entity_documents` (polymorphic), `reminders`, `activity_log` (trigger-written, append-only; rendered as the object Activity tab), `custom_field_definitions`, `saved_views`.
- `objects_grid` is a security-invoker SQL view powering list pages: one row per object with linked/computed columns (artist name, location paths, latest acquisition price + domestic conversion, latest valuation, insured total).
- Money pattern: each money-bearing table stores `currency` + `exchange_rate` (rate → workspace `default_currency` at the record's date). `lib/fx.ts` fetches historical rates from the Frankfurter API (free, no key).
- Phase 1+2 tables without UI yet: disposals, exhibitions, publications, condition_reports, conservation_treatments, consignments, shipments, provenance_events, reminders, custom field management.

### Interaction paradigm (important)

**View-first everywhere**: list row clicks open a read view; editing is an explicit action.
- Objects: `/dashboard/objects/[id]` — header card (hero image, status chip, compact copy-caption) + counted tab strip (components in `components/object/`). Info tab hides empty fields; an "Edit fields" toggle reveals all fields with click-to-edit (`InlineField` → `updateObjectFields`). Related-record tabs add/edit via dialogs. `?ctx=` carries ordered ids for prev/next paging.
- Other modules (acquisitions, loans, contacts, artists, locations, documents): `[id]` = read view built from `components/record-view.tsx` primitives (RecordToolbar/Field/Section/Empty); forms live at `[id]/edit` and redirect back to the view. Valuations/insurance/expenses lack detail routes (Phase 3).
- Inventory list: `components/list/` — status-bucket tabs, Filter popover + removable chips, dual-list column picker, saved views (per-user), selection tray with batch actions (`app/actions/views.ts`), money totals in default currency, table/gallery toggle.

### Design system

Exhibition-catalogue minimal. Fraunces (serif, `--font-serif`, all headings) + Archivo (body) via next/font with `latin-ext`; warm paper background, ink text, hairline borders, single oxblood accent (`--primary`); tokens in `app/globals.css`. Status chips are muted small-caps. Use `components/wordmark.tsx` for "DūArte" — Fraunces misrenders U+016B so the macron is drawn in CSS. Empty states use `components/empty-state.tsx`. Mobile: sidebar hides below `md`, `components/mobile-nav.tsx` provides the top bar + drawer; tables get `overflow-x-auto` wrappers with `min-w`; form grids collapse to one column.

### Gotchas

- **Date-only strings** (`YYYY-MM-DD` columns) must be parsed as local time: `new Date(s.includes('T') ? s : s + 'T00:00:00')` — otherwise lists show off-by-one dates. All `formatDate` helpers already do this; follow suit in new code.
- The dashboard scrolls inside `<main>`, not the window — components needing scroll position must find the nearest `overflow-y-auto` ancestor (see tab-switch handling in `components/object/object-detail.tsx`).
- Radix dialogs need a `DialogDescription` (or the dev overlay flags accessibility issues).

### Dev & test

- `/api/dev-login` (dev-only, 404s in production) signs in the test owner; `?as=2` signs in the viewer account. Credentials in `.env.local` (`DUARTE_TEST_*`).
- The test workspace is seeded with realistic data (objects with images, multi-currency acquisitions, valuation, insurance, loan, expenses, lists, linked PDFs). `scripts/seed-media.mjs` regenerates media/doc seeds (uploads to R2, prints SQL).
- Workflow: the user files GitHub issues (`gh issue list --repo emsharef/duarte`); fix, verify in the browser via dev-login, commit with `Fixes #N`, push, then re-check for new issues.

### R2 Storage

- Uploads go through `/api/upload-proxy` (original/medium/thumbnail via sharp) or server actions using `@/lib/r2`; keys are `{workspace_id}/{timestamp}-{filename}`; display via signed URLs.

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
ANTHROPIC_API_KEY   # reserved for AI features (Phase 4+); not used yet
```

### Roadmap

Rebuilding toward feature parity with Collector Systems/Arternal plus AI capabilities (to be ported from the Room Service project in `../arternal`). Specs, research notes, and plans live in `docs/superpowers/specs/` and `docs/superpowers/plans/`. **Done:** Phase 1 (workspaces + schema), Phase 2 (interaction model: object experience, list system, design overhaul, mobile, view-first module pages). **Next:** Phase 3 — registrar module UIs (disposals, exhibitions, condition reports, provenance editor, consignments, shipments), detail routes for valuations/insurance/expenses, a dedicated Lists page with reordering, document linking from module views. **Then:** Phases 4–5 AI (intake-style data entry with draft/approve queue, embeddings/chat/MCP, enrichment, valuations).
