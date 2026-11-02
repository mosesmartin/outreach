-- Run once in the Supabase SQL Editor. Safe to re-run; existing CRM data is untouched.
BEGIN;

CREATE TABLE IF NOT EXISTS public.website_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key TEXT UNIQUE NOT NULL,
  source_url TEXT NOT NULL CHECK (source_url LIKE 'https://%'),
  platform TEXT NOT NULL CHECK (platform IN ('reddit','linkedin','facebook','x','upwork','freelancer')),
  title TEXT NOT NULL,
  requirement TEXT NOT NULL,
  author_name TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  date_verified BOOLEAN NOT NULL CHECK (date_verified = true),
  date_evidence TEXT NOT NULL,
  public_email TEXT,
  public_phone TEXT,
  budget TEXT,
  niche TEXT,
  location TEXT,
  source_state TEXT NOT NULL DEFAULT 'request_detected'
    CHECK (source_state IN ('request_detected','closed','unavailable','needs_review')),
  status TEXT NOT NULL DEFAULT 'NEW'
    CHECK (status IN ('NEW','CONTACTED','REPLIED','DEMO_SENT','WON','CLOSED','DISMISSED')),
  notes TEXT NOT NULL DEFAULT '',
  last_checked_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_website_requests_published ON public.website_requests (published_at DESC);

-- Historical records without country evidence stay in storage but are excluded
-- from US results. Re-running this migration never relabels old records as US.
ALTER TABLE public.website_requests ADD COLUMN IF NOT EXISTS country_code TEXT;
ALTER TABLE public.website_requests ADD COLUMN IF NOT EXISTS country_evidence TEXT;
ALTER TABLE public.website_requests ADD COLUMN IF NOT EXISTS country_evidence_source TEXT;
DO $$ BEGIN
  ALTER TABLE public.website_requests ADD CONSTRAINT website_requests_us_evidence CHECK (
    (country_code IS NULL AND country_evidence IS NULL AND country_evidence_source IS NULL)
    OR (country_code IS NOT NULL AND country_code = 'US'
      AND country_evidence IS NOT NULL AND length(trim(country_evidence)) > 0
      AND country_evidence_source IS NOT NULL
      AND country_evidence_source IN ('author_address','organization_address','post_self_declaration'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_website_requests_us_published ON public.website_requests (published_at DESC)
WHERE country_code = 'US';

-- A rediscovered/edited post keeps its earliest known original publication date.
CREATE OR REPLACE FUNCTION public.preserve_website_request_date() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.published_at < NEW.published_at THEN
    NEW.published_at := OLD.published_at;
    NEW.date_evidence := OLD.date_evidence;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS preserve_website_request_date ON public.website_requests;
CREATE TRIGGER preserve_website_request_date BEFORE UPDATE ON public.website_requests
FOR EACH ROW EXECUTE FUNCTION public.preserve_website_request_date();

CREATE TABLE IF NOT EXISTS public.website_request_search_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  outcome TEXT NOT NULL DEFAULT 'running',
  stats JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_request_search_actor ON public.website_request_search_runs (actor, created_at DESC);

-- Database lock makes the cooldown work across simultaneous/serverless requests.
CREATE OR REPLACE FUNCTION public.claim_website_request_search(p_actor TEXT) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE run_id UUID;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_actor));
  IF EXISTS (SELECT 1 FROM public.website_request_search_runs
    WHERE actor = p_actor AND created_at > NOW() - INTERVAL '60 seconds') THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.website_request_search_runs (actor) VALUES (p_actor) RETURNING id INTO run_id;
  RETURN run_id;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_website_request_search(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_website_request_search(TEXT) TO service_role;

ALTER TABLE public.website_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_request_search_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.website_requests, public.website_request_search_runs FROM anon, authenticated;
GRANT ALL ON public.website_requests, public.website_request_search_runs TO service_role;
DROP POLICY IF EXISTS "Service access to website requests" ON public.website_requests;
CREATE POLICY "Service access to website requests" ON public.website_requests
FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service access to request search runs" ON public.website_request_search_runs;
CREATE POLICY "Service access to request search runs" ON public.website_request_search_runs
FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
COMMIT;
