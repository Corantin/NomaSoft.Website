# NomaSoft Site

Production-ready marketing site for NomaSoft built with Next.js 14 App Router, TypeScript, Tailwind CSS, Contentlayer, and next-intl.

## Tech Stack

- Next.js 14 with App Router and TypeScript
- Tailwind CSS with typography plugin
- next-intl for localized routing (`/en`, `/fr`)
- Contentlayer MDX for legal copy
- Zod validation on client and API
- Plausible analytics (optional)
- Playwright smoke tests

## Getting Started

```bash
npm install
npm run dev
```

The site is available at [http://localhost:3000](http://localhost:3000). Locale-aware routes live under `/en` and `/fr`.

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the values that apply to your deployment.

- `NEXT_PUBLIC_SITE_URL`: Canonical URL (required in production)
- `NEXT_PUBLIC_DEFAULT_LOCALE`: Default language (`en` or `fr`)
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`: Set to enable Plausible analytics
- `CONTACT_TO_EMAIL`: Recipient for contact emails (falls back to `content/site.json` contact email if unset)
- `CONTACT_FROM_EMAIL`: Optional default "from" address if different from the recipient
- `RESEND_API_KEY` or `SMTP_*`: Configure at least one mail provider
- `RESEND_FROM_EMAIL`: Verified sender when using Resend (falls back to `CONTACT_FROM_EMAIL`)
- `HCAPTCHA_SECRET`/`NEXT_PUBLIC_HCAPTCHA_SITE_KEY` or `TURNSTILE_SECRET`/`NEXT_PUBLIC_TURNSTILE_SITE_KEY`: Enable bot protection (set both the secret and site key for a provider to activate verification). The first successful contact submission in a browser skips the challenge. Another submission within 24 hours requires a check, then successful human verification is remembered in a signed, HttpOnly cookie for 24 hours. hCaptcha challenge difficulty is configured on the sitekey in the hCaptcha dashboard; changing the secret does not adjust it.

### Commands

| Script              | Description                    |
| ------------------- | ------------------------------ |
| `npm run dev`       | Start local development server |
| `npm run lint`      | Lint code with ESLint          |
| `npm run typecheck` | Run TypeScript checks          |
| `npm run build`     | Production build               |
| `npm run start`     | Start production server        |
| `npm run analyze`   | Analyze production bundle      |
| `npm run test:e2e`  | Execute Playwright smoke tests |

### Localization

Localized strings live in `public/locales/{en,fr}/common.json`. Keys are grouped by feature (`nav`, `sections`, `contact`, etc.). When adding new UI copy:

1. Add the key to the English file first.
2. Mirror the entry in the French file.
3. Reference the key in your component via `useTranslations`.

Structured marketing content (hero, services, process, portfolio) is stored in `content/site.json` for quick edits without code changes.

### Contentlayer / MDX

Legal pages are authored as MDX inside `content/mdx/legal`. Each file defines front matter for `title`, `slug`, and `locale`. Contentlayer generates typed data so you can import docs in React components.

To add a new MDX page:

1. Create a file under `content/mdx/<section>/<slug>.<locale>.mdx`.
2. Include the required front matter (`title`, `locale`, `slug`).
3. Query via `allLegalDocs` or configure a new document type in `contentlayer.config.ts`.

### Adding a Portfolio Item

1. Edit `content/site.json` and append to the `portfolio` array. Provide `title`, localized descriptions, tags, and link.
2. Add an optional image under `public/images/portfolio/` and update the map in `components/portfolio.tsx` if needed.
3. Re-run `npm run dev` or `npm run build` to see the update.

### Contact Form Pipeline

- Client-side: `components/contact-form.tsx` validates input with Zod and handles hCaptcha or Turnstile if configured.
- API route: `app/api/contact/route.ts` re-validates, verifies captcha tokens, sends emails via Resend or SMTP, and records the inquiry and any attachment in the CRM project notes. New senders enter the New lead column. Returning senders match by email regardless of case. If several projects match, the form uses an exact generated project title or the only non-closed project. Ambiguous inquiries open a New lead for triage.

### Deployment

Deploy to Vercel:

1. Import the repository into Vercel.
2. Set environment variables in the Vercel dashboard.
3. Enable `npm run build` as the build command (default).
4. Ensure Contentlayer builds by keeping the `next-contentlayer` plugin enabled in `next.config.ts`.

Vercel automatically handles image optimization and edge middleware for locale routing.

### Digital card and Wallet passes

The bilingual card lives at `/card` (redirecting to `/en/card` or `/fr/card`). Its
vCard download works without credentials. Wallet buttons appear only when the
corresponding server configuration is complete.

For Apple Wallet, create a Pass Type ID and Pass Type ID certificate in the Apple
Developer account. Export the certificate and its private key as PEM, and obtain
the Apple WWDR intermediate certificate. Base64-encode each PEM file and set
`APPLE_WALLET_PASS_TYPE_ID`, `APPLE_WALLET_TEAM_ID`,
`APPLE_WALLET_SIGNER_CERT_B64`, `APPLE_WALLET_SIGNER_KEY_B64`, and
`APPLE_WALLET_WWDR_CERT_B64` as server-only environment variables. Set
`APPLE_WALLET_SIGNER_KEY_PASSPHRASE` if the key is encrypted. The Apple route
signs a `.pkpass` with the branded images in `wallet/assets/`.

For Google Wallet, create a Wallet issuer account, authorize a Google Cloud
service account in that issuer, and enable the Wallet API. Base64-encode the
service account JSON and set `GOOGLE_WALLET_ISSUER_ID` and
`GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_B64` as server-only environment variables.
Run `node --env-file=.env scripts/setup-google-wallet.mjs` from a machine with
those variables configured. This creates or verifies the shared generic class
and object. After testing the save link and obtaining Google publishing access,
set `GOOGLE_WALLET_READY=true` and redeploy. The production button then signs
a save link that references that shared object.

Keep all certificates, private keys, and service account JSON out of Git and
client-side variables. The pass routes return HTTP 503 while unconfigured.

### Testing

Run the Playwright suite locally:

```bash
npm run test:e2e
```

This spins up `npm run dev`, executes smoke tests covering localization, the contact form, structured data, and viewport checks.

CI (`.github/workflows/ci.yml`) runs linting, type-checking, and `next build` on pushes and pull requests.

## Accessibility & SEO

- Skip-to-content link, focus styles, and semantic landmarks are included.
- Metadata and Open Graph tags are localized per page.
- JSON-LD defines Organization, Service, CreativeWork, WebSite, and Breadcrumb schemas.
- CSP, HSTS, Referrer-Policy, Permissions-Policy, and X-Content-Type-Options headers are configured in `next.config.ts`.

### Customer workspace

Open `/crm` and request an eight-digit sign-in code using your approved team email. NextAuth handles sign-in and sign-out. Codes expire in ten minutes and allow five attempts. Resend uses the site's configured sender. The encrypted HttpOnly access cookie lasts 15 minutes and renews through the HttpOnly NextAuth session cookie. Each browser session has a 30-day absolute lifetime and is revoked on sign-out. Set `NEXTAUTH_SECRET` to a strong random value and `NEXTAUTH_URL` to the canonical production origin. Allow Vercel to infer the host on previews. OTP verification and session revocation use Upstash Redis. Connect the database to the website in Vercel Storage. The service reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN or the KV_REST_API_URL and KV_REST_API_TOKEN equivalents. Redis keys are scoped to the CRM and environment. Customers, projects, stages, agreements, installments, payments, and tasks live in Redis. Google Sheets stores time entries.

To connect the NomaSoft hours workbook:

1. Open the workbook in Google Sheets, select **Extensions → Apps Script**, and add the code in `scripts/crm/Code.gs` as a new script file. If the workbook already serves another web app with a `doPost` handler, use a separate Apps Script project and set its script property `BOOK_ID` to the workbook ID before setup.
2. Enable **Google Sheets API** under **Services**. Set script property `CRM_SECRET` to a long random secret, then run `setupCRM` once. It creates the hours ledger if needed. Keep its headers and entry IDs intact.
3. Deploy as a web app executing as the workbook owner with access for **Anyone**. The script authenticates requests with the shared secret. Set the deployment's `/exec` URL as `CRM_SHEETS_WEB_APP_URL` and the same secret as `CRM_SHEETS_SECRET` on the website. Redeploy the website after configuring environment variables.
4. Add a customer with an engagement, edit it from its detail panel, and refresh. Use the existing customer selector for additional engagements. Use the stage dropdown for keyboard or touch access and drag cards on desktop. Payments roll up across all engagements for the selected customer.

### CRM MCP access

Connect ChatGPT to `https://www.nomasoft.dev/api/mcp` using OAuth and approve with a CRM member account. Tools share the board, task, note, attachment and hours handlers with the CRM UI.
