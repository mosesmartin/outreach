-- ==============================================================================
-- SYNERGYTECH SOLUTIONS: B2B Cold Outreach & Acquisition Engine
-- Database Schema for Supabase (PostgreSQL)
-- ==============================================================================

-- 1. Create ENUM for status tracking
DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('PENDING', 'QUALIFIED', 'SKIPPED', 'SENT', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Admin Users Table (Hashed Password Auth)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) DEFAULT 'Moses Martin',
    role VARCHAR(50) DEFAULT 'ADMIN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Main Leads Table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR(255) NOT NULL,
    business_slug VARCHAR(255),
    owner_name VARCHAR(255) DEFAULT 'Team',
    email VARCHAR(255) NOT NULL,
    website_url TEXT,
    has_website BOOLEAN DEFAULT true,
    category VARCHAR(100),
    city VARCHAR(100),
    services TEXT[] DEFAULT ARRAY[]::TEXT[],
    rating NUMERIC(2,1) DEFAULT 4.9,
    review_count INT DEFAULT 45,
    status lead_status DEFAULT 'PENDING',
    status_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Audit & Outreach Logs Table
CREATE TABLE IF NOT EXISTS audit_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    speed_score INT,
    lcp_seconds VARCHAR(50),
    page_size_mb VARCHAR(50),
    seo_score INT,
    seo_issues JSONB DEFAULT '[]'::jsonb,
    gemini_hook TEXT,
    prototype_url TEXT,
    email_subject TEXT,
    email_body TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_leads_pending ON leads (status, created_at) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_leads_slug ON leads (business_slug);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (email);

-- 6. Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service Role Full Access on admin_users" ON admin_users
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Full Access on leads" ON leads
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Full Access on audit_reports" ON audit_reports
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public Read Prototype Leads" ON leads
    FOR SELECT TO anon, authenticated USING (true);
