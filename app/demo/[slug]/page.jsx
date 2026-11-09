import React from 'react';
import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase';
import { currentDemoDraft } from '@/lib/manualDemo.mjs';
import { demoServices } from '@/lib/leadServices.mjs';
import { restoreImportedLead } from '@/lib/leadImport.mjs';
import DemoPrototypeClient from '@/components/DemoPrototypeClient';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Website concept | SynergyTech Solutions', robots: { index: false, follow: false }, other: { 'synergy-demo-version': 'manual-demo-v1' } };
export default async function DemoPrototypePage({ params, searchParams }) {
  if (!/^[0-9a-f-]{36}$/i.test(searchParams?.draft || '')) notFound();
  const db = getSupabaseAdmin();
  const { data: report, error } = await db.from('audit_reports').select('*,leads(*)').eq('id', searchParams.draft).maybeSingle();
  if (error || !report?.leads) notFound();
  const lead = restoreImportedLead(report.leads);
  const draft = currentDemoDraft(lead, [report]);
  if (!draft) notFound();
  const url = new URL(draft.prototype_url);
  if (url.pathname !== `/demo/${params.slug}` || url.searchParams.get('v') !== searchParams.v) notFound();
  const { services, suggested } = demoServices(lead);
  const publicLead = { business_name: lead.business_name, category: lead.category, city: lead.city, description: lead.description || '', services, services_suggested: suggested };
  return <DemoPrototypeClient initialLead={publicLead} />;
}
