# 🏢 SynergyTech Solutions: B2B Cold Outreach & Acquisition Engine

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
