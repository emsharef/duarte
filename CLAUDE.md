# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server on localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
npm run start    # Start production server
```

## Architecture

This is a multi-tenant art collection management application built with Next.js 16 (App Router) using React 19. The Supabase project ref is `acrvteypohtcmywoiudv`.

### Backend Services
- **Supabase**: Authentication (email/password + Google OAuth) and PostgreSQL database
- **Cloudflare R2**: Image/document storage (S3-compatible)

### Multi-tenancy (workspaces)

The tenant is a **workspace** (`workspaces`, `workspace_members` with roles owner/editor/viewer, `workspace_invites`). Every domain table carries `workspace_id` and is protected by RLS policies built on `is_workspace_member()` / `can_edit_workspace()` (security-definer helpers). A user's personal workspace is created lazily by the `ensure_personal_workspace()` RPC; invites are accepted at `/invite/[token]` via `accept_workspace_invite()`. The active workspace is stored in the `duarte-workspace` cookie; the sidebar has a switcher.

**Mandatory pattern for server actions and pages:**
- Use `getWorkspaceContext()` from `@/lib/workspace` — never `createClient()` directly (login/OAuth callback are the only exceptions).
- List queries filter `.eq('workspace_id', ctx.workspaceId)`. By-id reads rely on RLS (no workspace filter, so cross-workspace deep links resolve).
- Mutations call `requireEdit(ctx)` first (viewers are read-only); inserts set `workspace_id` — including junction tables.

### Database

- Migrations live in `supabase/migrations/` (checked in; applied via Supabase MCP `apply_migration` or `npx supabase db push`).
- Generated types in `lib/database.types.ts` (regenerate after schema changes); both Supabase clients are typed with them.
- RLS isolation test: `supabase/tests/rls_test.sql` — run it (it rolls back) after any policy change.
- Core tables: `objects` (lifecycle `status`: in_collection/on_loan/sold/... — see `OBJECT_STATUSES` in `lib/constants.ts`), `artists`, `contacts`, hierarchical `locations`, `categories`, `groups`, `object_media`, `object_dimensions`.
- Financial/registrar: `acquisitions`, `disposals`, `valuations`, `insurance_policies`, `expenses`, `loans`, `consignments`, `shipments` (+ `object_*` junction tables for each), `provenance_events`, `exhibitions`, `publications`, `condition_reports`, `conservation_treatments`, `object_components`, `documents`/`entity_documents` (polymorphic), `reminders`, `activity_log` (trigger-written, append-only), `custom_field_definitions`.
- Tables added in the schema rebuild (disposals, exhibitions, condition reports, provenance, consignments, shipments, etc.) have **no UI yet** — that's Phase 2; see `docs/superpowers/specs/`.

### Key Patterns

**Server Actions:**
- Located in `app/actions/` for shared actions; feature folders (e.g. `app/dashboard/objects/actions.ts`, `app/dashboard/settings/actions.ts`) for page-specific actions
- All mutations use `'use server'` and call `revalidatePath()` after changes

**R2 Storage:**
- Uploads go through `/api/upload-proxy` (multi-variant: original/medium/thumbnail via sharp) or server actions using `@/lib/r2`
- Keys are prefixed by workspace: `{workspace_id}/{timestamp}-{filename}`
- Signed URLs generated for display using `@aws-sdk/s3-request-presigner`

### UI Components
- Uses shadcn/ui (new-york style) with components in `components/ui/`
- Icons from lucide-react
- Forms use react-hook-form with zod validation; entity selection uses `components/contact-picker.tsx` / `components/location-picker.tsx` (searchable, create-inline)

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

The project is being rebuilt toward feature parity with Collector Systems/Arternal plus AI capabilities (ported from the Room Service project in `../arternal`). Specs and plans live in `docs/superpowers/specs/` and `docs/superpowers/plans/`. Phase 1 (workspaces + schema rebuild) is complete; Phase 2 is module UI parity; Phases 4–5 are AI (data entry, embeddings/chat/MCP, enrichment, valuations).
