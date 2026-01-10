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

This is an art collection management application built with Next.js 16 (App Router) using React 19.

### Backend Services
- **Supabase**: Authentication and PostgreSQL database
- **Cloudflare R2**: Image storage (S3-compatible)

### Key Patterns

**Supabase Client Usage:**
- Server components/actions: Use `createClient()` from `@/lib/supabase/server`
- Client components: Use `createClient()` from `@/lib/supabase/client`
- Middleware handles auth session refresh via `lib/supabase/middleware.ts`

**Server Actions:**
- Located in `app/actions/` for shared actions (artists, upload)
- Located in feature folders like `app/dashboard/actions.ts` for page-specific actions
- All mutations use `'use server'` directive and call `revalidatePath()` after changes

**R2 Image Handling:**
- Uploads go through server actions using `@/lib/r2` client
- Images stored with key pattern: `{user_id}/{timestamp}-{filename}`
- Signed URLs generated for display using `@aws-sdk/s3-request-presigner`

### Database Tables
- `objects`: Main artwork/inventory items
- `artists`: Artist records linked to objects
- `object_media`: Image references with `r2_key_thumbnail` and `is_primary` flag

### UI Components
- Uses shadcn/ui (new-york style) with components in `components/ui/`
- Icons from lucide-react
- Forms use react-hook-form with zod validation

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
```
