# Copilot Instructions for NomaSoft.Website

## Project Overview
- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS (with typography plugin)
- **Localization:** next-intl for `/en` and `/fr` routes; translation files in `public/locales/{en,fr}/common.json`
- **Content:** Contentlayer for MDX-based legal pages (`content/mdx/legal`), structured marketing content in `content/site.json`
- **Validation:** Zod for client/API validation
- **Testing:** Playwright for smoke tests (`tests/smoke.spec.ts`)
- **Analytics:** Plausible (optional)

## Key Patterns & Conventions
- **Routing:**
  - Locale-aware routes: `/en`, `/fr`, and `[locale]` dynamic fallback
  - All pages/components are colocated under `app/` by locale
- **Localization:**
  - Add new UI copy keys to `public/locales/en/common.json` first, then mirror in `fr`
  - Use `useTranslations` hook for accessing translations
- **Contentlayer/MDX:**
  - Legal docs in `content/mdx/legal` with front matter (`title`, `slug`, `locale`)
  - Import Contentlayer types for typed doc access in React
- **Forms:**
  - Contact form uses Zod validation and posts to `/api/contact/route.ts`
  - Email delivery via Resend or SMTP (see `.env.example`)
  - Bot protection via hCaptcha or Turnstile (configurable)
- **Testing:**
  - Run Playwright tests with `npm run test:e2e`
  - Add new tests in `tests/`

## Developer Workflows
- **Install:** `npm install`
- **Dev server:** `npm run dev` (http://localhost:3000)
- **Lint:** `npm run lint`
- **Typecheck:** `npm run typecheck`
- **Build:** `npm run build`
- **Start (prod):** `npm run start`
- **Analyze bundle:** `npm run analyze`

## Integration Points
- **Contact API:** `/app/api/contact/route.ts` (handles form, email, bot protection)
- **Analytics:** `components/plausible-analytics.tsx` (enabled via env var)
- **Localization:** `lib/i18n.ts`, `components/lang-switcher.tsx`

## Notable Files & Directories
- `app/` — All routes, organized by locale
- `components/` — UI components (navbar, footer, forms, etc.)
- `content/` — Site content and legal MDX
- `public/locales/` — Translation files
- `lib/` — Utilities (i18n, schema, SEO, validators)
- `tests/` — Playwright tests

## Tips for AI Agents
- Prefer updating both locale files for new UI copy
- Use Contentlayer types for MDX content
- Reference `.env.example` for required environment variables
- Follow the existing folder structure for new features
- Use Zod for all new validation logic

For more, see `README.md` and referenced files above.
