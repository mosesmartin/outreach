const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const rawData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'apify_no_website_leads.json'), 'utf-8'));
console.log(`Loaded ${rawData.length} leads from apify_no_website_leads.json`);

const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    }
  }
});

const ws = require('ws');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws },
});

function generateSlug(str) {
  return (str || 'business')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function testImport() {
  for (const item of rawData) {
    const slug = generateSlug(item.name);
    const leadRecord = {
      business_name: item.name,
      business_slug: slug,
      owner_name: 'Team',
      email: `contact@${slug}.local`,
      website_url: null,
      has_website: false,
      category: item.category || 'Local Services',
      city: item.city || 'Metro Area',
      rating: item.rating || 4.9,
      review_count: item.reviews || 25,
      status: 'SKIPPED',
      status_reason: `Prototype live at /demo/${slug} • Phone: ${item.phone || 'N/A'}`
    };

    console.log(`Importing: "${leadRecord.business_name}" -> /demo/${slug}`);
    const { data, error } = await supabase.from('leads').insert(leadRecord).select();
    if (error) {
      console.log(`  ❌ Error on ${item.name}:`, error.message);
    } else {
      console.log(`  ✅ Successfully inserted into Supabase! ID: ${data[0]?.id}`);
    }
  }
  console.log('Finished testing Apify leads import.');
}

testImport();
