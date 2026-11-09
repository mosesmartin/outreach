# 🏢 SynergyTech Solutions: B2B Cold Outreach & Acquisition Engine

## Interactive demo design (UI UX Pro Max)

The active design workflow is the repository's `ui-ux-pro-max` skill. The shared
demo includes a three-step enquiry planner, selectable service details, filtered
concept previews with native dialogs, section-aware navigation and restrained
entrance animations. Planner choices create an editable brief in the sample form.
Dialogs support keyboard focus and Escape, and reduced-motion preferences disable
animations. These interactions apply across the lead categories; nothing is sent
or written to the database from a public demo.

The demo now renders a complete one-page website: responsive navigation, hero,
About, detailed services, a proposed process, illustrative concept examples,
website benefits, FAQs, contact information when publicly sourced, a sample form
and footer. Service links preselect the enquiry topic. Examples are clearly
identified as concepts; no client projects, testimonials, prices or results are
fabricated. Draft access checks and preview-only enquiry behavior remain in place.

`lib/demoContent.mjs` selects copy and visual direction by actual services and
industry. It preserves supplied descriptions and service lists. A first-party
profile for SynergyTech uses public information from `https://synergytechsol.com/`
(checked 2026-11-09), correcting the old Home & Commercial Services / Dallas
defaults in its presentation without modifying saved lead records or draft IDs.
Other businesses do not inherit SynergyTech's public contact details. New manual
leads start with blank category/city fields, require an industry, and accept an
optional business description.

Unslop by [Damir Sokolovsky](https://github.com/heydamir/unslop) (CC BY 4.0)
remains installed as an optional local skill; it is not the active design workflow.
Historical attribution is retained for earlier derived work. New direction uses
UI UX Pro Max's interactive experience, motion, progress and accessibility guidance.

Run `node scripts/preview-demo-design.cjs --before` to capture the committed
design, then `node scripts/preview-demo-design.cjs` for the current design.
Open `.local-previews/ui-ux-pro-max/index.html` for the comparison and interactive
previews. The script uses installed Chrome, local fixtures and bundled assets;
it does not write database records or send enquiries. It checks responsive
overflow, navigation, required sections, section links, FAQs, service selection
and the sample form. Add `--url "http://127.0.0.1:3107/demo/...?..."` to verify an
existing saved draft in a running local production build (the server reads the
draft from Supabase). Preview files are ignored by Git. Run `npm run test:outreach`
and `npm run build` for regression checks. Local changes require deployment to
appear on the hosted site.

## Current outreach workflow: manual demo, review, then send

Manual and CSV imports confirm success only after Supabase returns saved records.
Older lead schemas are supported without a migration: optional contact/CRM fields
are retained with the saved record and restored on reads. Failed saves keep the
single-lead form open with its values and an error. Successful manual saves clear
filters, show a confirmation and refresh the list; failed list refreshes preserve
the visible records and show an error. Imports no longer report local JSON writes
as successful database saves.

Business discovery/import saves contacts only. Each lead has a **Generate demo**
button, which saves a draft in `audit_reports` and does not send email. Open the
generated concept, check the business's services and verify the recipient, then
check the review box and click **Send reviewed email**. Existing tables are reused;
this workflow needs no additional SQL migration.

- No simulated business quota filling, guessed `contact@` addresses or invented
  Gmail contacts. Empty and partial provider batches remain empty/partial. Missing
  email, ratings and services stay missing. Real numeric email usernames are kept.
- Exact historical simulation fingerprints are blocked. Original contact fields
  and sent history are retained for audit. `scripts/quarantine-synthetic-leads.cjs`
  previews matches; `--apply` changes only queue status and a quarantine note.
  Placeholder-only email fields do not invalidate a real phone/business lead, but
  they cannot be used for email outreach.
- Public demo pages require a saved draft UUID and a matching lead fingerprint.
  Plain slug URLs and unknown businesses no longer manufacture mock demos.
  Changes to the recipient/services invalidate older drafts. Demos use concept
  labels and sample enquiry interactions, with no fabricated reviews, performance
  scores, guarantees or actual customer submissions.
- Legacy process/SSE endpoints return 410; cron and direct MCP SMTP dispatch do
  not send invitations. Only the authenticated reviewed-send action can send a
  lead invitation. A database claim prevents sending one draft twice. Missing SMTP
  fails explicitly; MX checking does not prove mailbox ownership or inbox delivery.
  Sending also checks that the public demo URL serves the current preview version;
  an old deployment, unavailable preview or invalidated link blocks dispatch.
- Changes must be deployed to update an already hosted site. Local validation does
  not change the hosted application's code. Historical quarantine updates are live
  database changes; they never delete records or clear their contact fields.

Run `npm run test:outreach` for contact, demo, approval and duplicate-send checks.
Earlier automated-pipeline descriptions below describe the previous implementation.

## Website Requests (Google buyer-request discovery)

Open `/website-requests` from the dashboard's **Website Requests** link. Each saved
request has a private detail page with its original post, publication evidence,
public contact details (when present), outreach status and notes.

One-time setup: run [`supabase/website_requests.sql`](./supabase/website_requests.sql)
in the Supabase SQL Editor. The migration is re-runnable, adds separate private
tables, and leaves existing leads unchanged. No anonymous read access is granted.
The page's **Copy setup SQL** / **Open SQL Editor** buttons provide the same setup.
Supabase URL, anon key and service role key are Data API credentials; they are not
a direct PostgreSQL connection or a Management API personal access token, so they
cannot apply this DDL migration through the app's existing REST client.
This feature requires the server's `SUPABASE_SERVICE_ROLE_KEY` and existing
`DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` (or `DATAFORSEO_API_KEY=login:password`).
Credentials stay on the server. Missing setup produces an actionable error;
requests are never silently saved to local JSON.

- **Today** is the default; **Last 3 days** and **Last 7 days** include that many
  calendar days in `Asia/Karachi` (UTC+05:00). Saved results are filtered again on
  every read; edited or rediscovered posts retain their earliest publication date.
- Each user-triggered search makes two paid DataForSEO Google Organic queries,
  at depth 10, and inspects up to 12 deduplicated original posts. A database-backed
  60-second cooldown prevents overlapping searches per admin. Refreshing saved
  requests never triggers a paid search.
- Google date filters are a discovery hint. A request is only saved after an
  original post supplies an absolute, timezone-aware publication timestamp
  (structured metadata, `article:published_time`, or Reddit submission `created_utc`).
  Search snippets, modification dates, comment dates and discovery time are not
  publication evidence. Date-only/undated posts, closed requests, seller ads,
  employment ads and inaccessible sources are excluded. Zero results remain zero.
  Discovery uses a rolling Google day/week filter; the exact selected Karachi
  calendar range is checked against the original date. Google result redirect
  wrappers are resolved only to supported public post URLs.
- Supported public individual posts: Reddit, LinkedIn, Facebook, X, Upwork and
  Freelancer. Login walls and private groups are not bypassed. Google does not
  index every post, and some platforms restrict public access, so coverage is
  intentionally incomplete. Basic phrase matching can miss requests or require
  manual review. A verified recent publication does not prove the job is still open.
- **Check source again** refreshes source availability without changing the original
  date or outreach notes. Requests that fail rechecking leave the fresh list.
  Contact fields only show details found in the original post; otherwise use its
  native reply/DM/proposal option. Messages are never sent automatically.
- **USA clients only:** US/English Google results and US query terms narrow discovery.
  Before saving, the original requester must declare a US location in their post
  (for example, "My business is based in Austin, Texas") or in structured requester/
  organization address metadata. Currency, +1 phone numbers, a US search region,
  job applicant restrictions, and a US target audience do not prove client location.
  Non-US, conflicting and unknown locations are excluded. This is source-declared
  location evidence, not independent identity/residency verification. Conservative
  matching misses clients who do not publish an unambiguous location.
  The optional city/state input narrows US discovery further; it never overrides
  the required source evidence. Historical records without evidence are not relabeled.

Run `npm run test:requests` for freshness/source/provider regression checks and
`npm run build` for the production build. `node scripts/check-request-storage.cjs`
performs a read-only storage readiness check without printing credentials.

Provider reference: [DataForSEO Google Organic API](https://docs.dataforseo.com/v3/serp/google/organic/live/advanced/)
and [Google date parameters](https://dataforseo.com/help-center/google-search-engine-parameters-and-how-to-use-them).

> **Brand**: SynergyTech Solutions (`synergytechsol.com`)  
> **Sender Identity**: `mosesmartin@synergytechsol.com`  
> **Architecture**: Automated Next.js 14+ (App Router) + Supabase (PostgreSQL) + Google Gemini 1.5 Flash + Google PageSpeed Insights API + Cheerio SEO Scanner + Nodemailer + Vercel Cron.

---

## ⚡ Key Highlights & Capabilities

1. **Automated Dual-Funnel Architecture**:
   - **Funnel A (Website Exists)**: Runs mobile Google PageSpeed Insights + Technical SEO, AI Citability (GEO) & Local Schema audit. If composite benchmark is below 50 (< 50), Gemini creates a casual teardown hook and dispatches a 4-pillar executive PDF + technical outreach email. Sites with composite average >= 50 are marked `SKIPPED`.
   - **Funnel B (No Website Found)**: Instantly mounts a mobile-first responsive landing page prototype at `/demo/[slug]`. Gemini composes a casual pitch hook and dispatches a plain-text live prototype offer email.
2. **Safe 1-Hour Controlled Dispatch**:
   - Vercel Cron (`0 9-15 * * 1-5`) queries strictly **1 lead per hour** during business hours, preventing spam triggers and guaranteeing highest inbox deliverability.
3. **High-Converting Plain-Text Email Templates**:
   - Ultra-clean text formatting without tracking pixels or bulky HTML styling for optimal Google Workspace deliverability.
4. **Interactive Command Center UI**:
   - Real-time queue monitor, CSV bulk drag-and-drop importer, single lead builder, manual test dispatcher, Apify webhook guide, and audit/email inspector drawer.

---

## 🚀 Quick Setup & Configuration

### 1. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your service keys:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini API
GEMINI_API_KEY=AIzaSy...

# Optional PageSpeed API Key (Recommended for higher limits)
PAGESPEED_API_KEY=

# Google Workspace / SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=mosesmartin@synergytechsol.com
SMTP_PASS=your-google-app-password
EMAIL_FROM="Moses Martin <mosesmartin@synergytechsol.com>"

# Vercel Cron Security
CRON_SECRET=synergytech_super_secret_cron_token_2026

# App URL (Used for demo links in cold emails)
NEXT_PUBLIC_APP_URL=https://synergytechsol.com
```

### 2. Run Database Migration in Supabase
Open your **Supabase Dashboard -> SQL Editor** and run the contents of [`supabase/schema.sql`](./supabase/schema.sql).

This sets up:
- `lead_status` ENUM (`'PENDING'`, `'QUALIFIED'`, `'SKIPPED'`, `'SENT'`, `'FAILED'`)
- `leads` table with slug, business metadata, category, city, website_url, has_website, status
- `audit_reports` table for logging metrics, Gemini hooks, and email bodies
- Partial queue index `idx_leads_pending`

### 3. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

---

## 📡 API Endpoints Reference

### 1. Ingest Leads (JSON / Apify Webhook / CSV)
- **Endpoint**: `POST /api/leads`
- **Headers**: `Content-Type: application/json` or `Content-Type: text/csv`
- **JSON Payload Example**:
```json
[
  {
    "business_name": "Apex Austin Plumbing",
    "owner_name": "Marcus",
    "email": "marcus@apexaustinplumbing.com",
    "website_url": "https://example.com",
    "has_website": true,
    "category": "Plumbing Services",
    "city": "Austin, TX"
  },
  {
    "business_name": "Highland Precision Detailing",
    "owner_name": "James",
    "email": "james@highlanddetailing.com",
    "has_website": false,
    "category": "Auto Detailing",
    "city": "Houston, TX"
  }
]
```

### 2. Vercel Cron Safe Dispatcher (1 lead / hr)
- **Endpoint**: `GET /api/cron/process-lead`
- **Headers**: `Authorization: Bearer <CRON_SECRET>`
- **Behavior**: Selects oldest `PENDING` lead, runs Funnel A or Funnel B, dispatches email, records report, and updates status.

### 3. Manual Single Lead Runner (Test / Debug)
- **Endpoint**: `POST /api/leads/process-single`
- **Body**: `{ "leadId": "optional-uuid" }` (If omitted, processes next pending lead).

---

## 🌐 Dynamic Prototype Engine
- Leads without websites are automatically linked to:
  `https://synergytechsol.com/demo/[business-slug]`
- Generates a tailored mobile-first landing page with direct quote booking, service listings, verified badge, and local response guarantees.

---

## 🛡️ Vercel Deployment & Cron Configuration
The `vercel.json` file is pre-configured:
```json
{
  "crons": [
    {
      "path": "/api/cron/process-lead",
      "schedule": "0 9-15 * * 1-5"
    }
  ]
}
```
When deployed to Vercel, the cron automatically triggers every hour from 9 AM to 3 PM UTC Monday through Friday.
