// Local browser QA with intercepted API fixtures. No paid calls, database writes or messages.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
require('@next/env').loadEnvConfig(process.cwd());

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const base = 'http://127.0.0.1:3107';
const fixture = {
  id: 'aabbccdd-1111-4222-8333-aabbccddeeff', source_key: 'reddit:qa123',
  source_url: 'https://www.reddit.com/r/forhire/comments/qa123/', platform: 'reddit',
  title: '[Hiring] Website for a local auto detailing business',
  requirement: 'Looking for a web designer to build a mobile website for my auto detailing business. I need a services page, a gallery and a quote form. Budget: $800.',
  author_name: 'Example owner', published_at: new Date().toISOString(),
  date_verified: true, date_evidence: 'Original Reddit post created_utc',
  public_email: null, public_phone: null, budget: '$800',
  country_code: 'US', country_evidence: 'My business is based in Austin, Texas, USA', country_evidence_source: 'post_self_declaration',
  source_state: 'request_detected', status: 'NEW', notes: '', last_checked_at: new Date().toISOString(),
};

(async () => {
  const output = await fs.mkdtemp(path.join(os.tmpdir(), 'synergy-request-ui-'));
  const browser = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=9337', `--user-data-dir=${path.join(output, 'profile')}`, 'about:blank',
  ], { windowsHide: true, stdio: 'ignore' });
  let socket;
  try {
    let targets;
    for (let i = 0; i < 50; i++) {
      try { targets = await (await fetch('http://127.0.0.1:9337/json')).json(); if (targets.length) break; } catch {}
      await sleep(200);
    }
    assert.ok(targets?.length, 'Chrome debugger started');
    socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
    let nextId = 0;
    const pending = new Map();
    const runtimeErrors = [];
    let setupError = false;
    let searchCalls = 0;
    let saveCalls = 0;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 15000);
      pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
    });
    socket.on('message', async (raw) => {
      const message = JSON.parse(raw);
      if (message.id) {
        const entry = pending.get(message.id);
        if (entry) { clearTimeout(entry.timer); pending.delete(message.id); message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result); }
      } else if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.text);
      else if (message.method === 'Fetch.requestPaused') {
        const { requestId, request } = message.params;
        let payload;
        let status = 200;
        const url = new URL(request.url);
        if (url.pathname.endsWith('/setup')) {
          payload = { sql: '-- UI fixture only, never executed\nSELECT 1;', sqlEditorUrl: 'https://supabase.com/dashboard/project/abcdefghijklmnopqrst/sql/new' };
        } else if (url.pathname.endsWith('/search')) {
          searchCalls++;
          payload = { stats: { saved: 1, searched: 2, checked: 1, skipped: { old_or_future: 0, unverified_date: 0, unavailable: 0, closed: 0, seller: 0, employment: 0, not_a_request: 0 } }, warnings: [] };
        } else if (url.pathname.endsWith(fixture.id)) {
          if (request.method === 'PATCH') {
            const body = JSON.parse(request.postData);
            if (body.action === 'recheck') fixture.source_state = 'closed';
            else { fixture.status = body.status; fixture.notes = body.notes; saveCalls++; }
          }
          payload = { request: fixture };
        } else if (setupError) { status = 503; payload = { error: 'Website Requests needs its database setup.', code: 'SETUP_REQUIRED' }; }
        else payload = { requests: [fixture], lastSearch: null, searchConfigured: true };
        await send('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(payload)).toString('base64') });
      }
    });
    await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
    const token = jwt.sign({ id: 'browser-qa', role: 'ADMIN' }, process.env.CRON_SECRET, { expiresIn: '10m' });
    await send('Network.setCookie', { name: 'synergy_auth_session', value: token, url: base, httpOnly: true, sameSite: 'Lax' });
    await send('Fetch.enable', { patterns: [{ urlPattern: `${base}/api/website-requests*`, requestStage: 'Request' }] });
    const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
    const waitFor = async (expression) => {
      for (let i = 0; i < 60; i++) { if (await evaluate(expression)) return; await sleep(150); }
      throw new Error(`UI condition failed: ${expression}`);
    };
    const screenshot = async (name) => {
      const image = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
      await fs.writeFile(path.join(output, name), Buffer.from(image.data, 'base64'));
    };
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `${base}/website-requests` });
    await waitFor(`document.body.innerText.includes(${JSON.stringify(fixture.title)})`);
    assert.equal(await evaluate(`document.querySelector('[aria-pressed="true"]').textContent`), 'Today');
    assert.equal(await evaluate(`document.body.innerText.includes('USA clients only')`), true);
    assert.equal(await evaluate(`document.body.innerText.includes('US city or state')`), true);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true);
    await screenshot('requests-desktop.png');
    await evaluate(`document.querySelector('button[type="submit"]').click()`);
    await waitFor(`document.body.innerText.includes('matching request saved')`);
    assert.equal(searchCalls, 1);
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true);
    await screenshot('requests-mobile.png');
    await send('Page.navigate', { url: `${base}/website-requests/${fixture.id}` });
    await waitFor(`document.body.innerText.includes('Track the conversation')`);
    assert.equal(await evaluate(`document.body.innerText.includes('Austin, Texas, USA')`), true);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true);
    await evaluate(`(() => { const select = document.querySelector('form select'); const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; setter.call(select, 'CONTACTED'); select.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await evaluate(`document.querySelector('button[type="submit"]').click()`);
    await waitFor(`document.body.innerText.includes('Outreach status and notes saved.')`);
    assert.equal(saveCalls, 1); assert.equal(fixture.status, 'CONTACTED');
    await screenshot('request-detail-mobile.png');
    await evaluate(`[...document.querySelectorAll('button')].find(button => button.textContent === 'Check source again').click()`);
    await waitFor(`document.body.innerText.includes('removed from fresh results')`);
    setupError = true;
    await send('Page.navigate', { url: `${base}/website-requests` });
    await waitFor(`document.body.innerText.includes('One-time setup:')`);
    assert.equal(await evaluate(`document.querySelector('button[type="submit"]').disabled`), true);
    await evaluate(`[...document.querySelectorAll('button')].find(button => button.textContent === 'Copy setup SQL').click()`);
    await waitFor(`document.body.innerText.includes('Open SQL Editor')`);
    assert.equal(await evaluate(`document.querySelector('a[href*="supabase.com/dashboard/project/"]').href`), 'https://supabase.com/dashboard/project/abcdefghijklmnopqrst/sql/new');
    assert.deepEqual(runtimeErrors, []);
    console.log(JSON.stringify({ passed: true, checks: ['Today default', 'USA-only labels', 'client location evidence', 'desktop/mobile no overflow', 'source/detail view', 'search interaction', 'status save', 'closed recheck', 'SQL setup copy/editor link', 'no browser exceptions'], fixtureOnly: true, screenshots: output }));
    await send('Browser.close');
  } finally { socket?.close(); browser.kill(); }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
