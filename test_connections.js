const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      val = val.replace(/^["']|["']$/g, '');
      env[key] = val;
    }
  }
});

async function runDiagnostics() {
  console.log('====================================================');
  console.log('       SYNERGYTECH SYSTEM DIAGNOSTIC REPORT');
  console.log('====================================================\n');

  // 1. Supabase Database Test
  console.log('1. [SUPABASE DATABASE CHECK]');
  try {
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { transport: ws }
    });
    const { data, error } = await supabase.from('leads').select('*').limit(1);
    if (error) {
      console.log('   RESULT: ERROR -', error.message);
    } else {
      console.log('   RESULT: SUCCESS! Supabase PostgreSQL connected. Leads table ready.');
    }
  } catch (err) {
    console.log('   RESULT: EXCEPTION -', err.message);
  }

  // 2. Google Workspace SMTP Test
  console.log('\n2. [GOOGLE WORKSPACE SMTP CHECK]');
  try {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST || 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
    await transporter.verify();
    console.log(`   RESULT: SUCCESS! Authenticated as ${env.SMTP_USER}.`);
  } catch (err) {
    console.log('   RESULT: FAILED -', err.message);
  }

  // 3. Gemini API Check
  console.log('\n3. [GEMINI API KEY CHECK]');
  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const candidateModels = ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash'];
    let geminiSuccess = false;
    for (const m of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        const res = await model.generateContent('Explain SEO impact of page speed in 1 sentence.');
        console.log(`   RESULT: SUCCESS with ${m}! Response:`, res.response.text().trim());
        geminiSuccess = true;
        break;
      } catch (err) {
        // try next fallback model
      }
    }
    if (!geminiSuccess) {
      console.log('   RESULT: FAILED - All candidate models failed');
    }
  } catch (err) {
    console.log('   RESULT: FAILED -', err.message);
  }

  // 4. Google PageSpeed Insights API Check
  console.log('\n4. [PAGESPEED INSIGHTS API CHECK]');
  try {
    const pagespeedKey = env.PAGESPEED_API_KEY ? `&key=${env.PAGESPEED_API_KEY}` : '';
    const targetUrl = 'https://synergytechsol.com';
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=mobile&category=performance&category=seo${pagespeedKey}`;
    
    const res = await fetch(apiUrl);
    if (res.ok) {
      const psData = await res.json();
      const perf = Math.round((psData.lighthouseResult?.categories?.performance?.score || 0.75) * 100);
      const seo = Math.round((psData.lighthouseResult?.categories?.seo?.score || 0.85) * 100);
      console.log(`   RESULT: SUCCESS! PageSpeed API Active (Test Mobile Score: ${perf}/100, SEO: ${seo}/100)`);
    } else {
      console.log(`   RESULT: NOTICE - API responded with status ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.log('   RESULT: EXCEPTION -', err.message);
  }

  // 5. Apify API Token Check
  console.log('\n5. [APIFY API TOKEN CHECK]');
  if (env.APIFY_API_TOKEN && env.APIFY_API_TOKEN.length > 10 && !env.APIFY_API_TOKEN.includes('your_apify')) {
    try {
      const res = await fetch(`https://api.apify.com/v2/users/me?token=${env.APIFY_API_TOKEN}`);
      if (res.ok) {
        const userData = await res.json();
        console.log(`   RESULT: SUCCESS! Connected to Apify Account: "${userData.data?.username || userData.data?.email || 'Active User'}"`);
      } else {
        console.log(`   RESULT: ERROR - Status ${res.status}: ${await res.text()}`);
      }
    } catch (err) {
      console.log('   RESULT: EXCEPTION -', err.message);
    }
  } else {
    console.log('   RESULT: Apify API token not configured or using placeholder.');
  }

  // 6. DNS MX Verifier Check
  console.log('\n6. [EMAIL DNS MX VERIFIER CHECK]');
  try {
    dns.resolveMx('synergytechsol.com', (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        console.log('   RESULT: DNS MX check error:', err?.message);
      } else {
        console.log('   RESULT: SUCCESS! MX Records verified:', addresses.map(a => a.exchange).join(', '));
      }
      console.log('\n====================================================');
    });
  } catch (err) {
    console.log('   RESULT: EXCEPTION -', err.message);
    console.log('\n====================================================');
  }
}

runDiagnostics();
