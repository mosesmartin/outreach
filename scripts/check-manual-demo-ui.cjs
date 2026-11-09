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
  id: 'aabbccdd-1111-4222-8333-aabbccddeeff', business_name: 'Example Hair Studio', business_slug: 'example-hair-studio',
  category: 'Hair Salon', city: 'Austin, TX', owner_name: 'Alex', email: 'alex2028@example.test', phone: '+1 512 555 0100',
  status: 'PENDING', services: ['Haircuts', 'Styling'], contact_safety: { blocked: false }, demo: null, notes: [],
};
const blocked = { id: 'bbbbbbbb-1111-4222-8333-aabbccddeeff', business_name: 'Blocked historical record', category: 'Hair Salon', status: 'SKIPPED', contact_safety: { blocked: true, reason: 'Blocked simulated contact. History preserved.' }, email: null, phone: null };
const draft = { id: 'cccccccc-1111-4222-8333-aabbccddeeff', prototype_url: base+'/demo/example-hair-studio?draft=cccccccc-1111-4222-8333-aabbccddeeff&v=fixture', email_subject: 'Website concept for Example Hair Studio', email_body: 'Hi Alex,\n\nA mobile website concept showing services, opening hours and appointment options.\n\nPreview: [fixture URL]', sent_at: null };

(async () => {
  const output = await fs.mkdtemp(path.join(os.tmpdir(), 'synergy-request-ui-'));
  const ts = require('typescript');
  const Module = require('node:module');
  const React = require('react');
  const { renderToString } = require('react-dom/server');
  const filename = path.join(process.cwd(), 'components', 'DemoPrototypeClient.jsx');
  const compiled = ts.transpileModule(await fs.readFile(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const componentCss = await fs.readFile(path.join(process.cwd(), 'components', 'DemoPrototypeClient.module.css'), 'utf8');
  const classNames = Object.fromEntries([...componentCss.matchAll(/\.([a-zA-Z_][\w-]*)/g)].map(match => [match[1], match[1]]));
  const renderedModule = new Module(filename);
  renderedModule.paths = Module._nodeModulePaths(process.cwd());
  renderedModule.require = name => name.endsWith('.module.css') ? classNames : require(name);
  renderedModule._compile(compiled, filename);
  const { demoServices } = await import('../lib/leadServices.mjs');
  const corrected = demoServices({ category: 'Hair Salon', services: ['Emergency AC Repair & Recharge'] });
  const markup = renderToString(React.createElement(renderedModule.exports.default, { initialLead: { ...fixture, services: corrected.services, services_suggested: corrected.suggested }, initialTheme: { buttonClass: 'bg-blue-600 text-white', accentText: 'text-cyan-300', gradientClass: 'from-blue-950 to-slate-900' } }));
  const css = (await fs.readdir(path.join(process.cwd(), '.next', 'static', 'css'))).filter(file => file.endsWith('.css')).map(file => `<link rel="stylesheet" href="${base}/_next/static/css/${file}">`).join('');
  const demoHtml = `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1">${css}<style>${componentCss}</style></head><body class="font-sans">${markup}</body></html>`;
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
    let importCalls = 0;
    let importFails = true;
    let leadListUnavailable = false;
    const importedLeads = [];
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
      } else if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
      else if (message.method === 'Fetch.requestPaused') {
        const { requestId, request } = message.params;
        if (request.url.startsWith(base + '/demo/')) {
          await send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/html' }], body: Buffer.from(demoHtml).toString('base64') });
          return;
        }
        let payload;
        let status = 200;
        const url = new URL(request.url);
        if (url.pathname === '/api/auth/me') payload = { user: { name: 'QA Admin', role: 'ADMIN' } };
        else if (url.pathname === '/api/leads' && request.method === 'GET') {
          status = leadListUnavailable ? 503 : 200;
          payload = leadListUnavailable ? { error: 'Could not load saved leads from the database.' } : { configured: true, leads: [fixture, blocked, ...importedLeads] };
        }
        else if (url.pathname === '/api/leads' && request.method === 'POST') {
          importCalls++;
          const submitted = JSON.parse(request.postData);
          assert.equal(submitted.business_name, 'synergy');
          assert.equal(submitted.email, null);
          assert.equal(submitted.category, 'IT Consulting');
          assert.equal(submitted.city, '', 'no fabricated default city');
          await sleep(200);
          if (importFails) { status = 503; payload = { error: 'The database could not save this lead.' }; }
          else {
            const saved = { ...submitted, id: 'dddddddd-1111-4222-8333-aabbccddeeff', status: 'PENDING', stage: 'NEW_LEAD', contact_safety: { blocked: false }, demo: null };
            importedLeads.push(saved);
            payload = { success: true, ingestedCount: 1, leads: [saved] };
          }
        }
        else if (url.pathname === '/api/stats') payload = { configured: true, totalLeads: 2, pending: 1, blockedContacts: 1, prototypesReady: fixture.demo ? 1 : 0 };
        else if (url.pathname.endsWith('/generate-demo')) { searchCalls++; fixture.demo = { ...draft }; payload = { success: true, emailSent: false, draft: fixture.demo }; }
        else if (url.pathname.endsWith('/send-reviewed')) {
          const approved = JSON.parse(request.postData);
          assert.equal(approved.reviewed, true);
          assert.equal(approved.body, draft.email_body);
          saveCalls++; fixture.status = 'SENT'; fixture.demo.sent_at = new Date().toISOString();
          payload = { success: true, message: 'Test SMTP accepted reviewed invitation.' };
        } else { throw new Error('Unexpected API request: ' + url.pathname); }
        await send('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(payload)).toString('base64') });
      }
    });
    await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
    const token = jwt.sign({ id: 'browser-qa', role: 'ADMIN' }, process.env.CRON_SECRET, { expiresIn: '10m' });
    await send('Network.setCookie', { name: 'synergy_auth_session', value: token, url: base, httpOnly: true, sameSite: 'Lax' });
    await send('Fetch.enable', { patterns: [{ urlPattern: `${base}/api/*`, requestStage: 'Request' }, { urlPattern: `${base}/demo/*`, requestStage: 'Request' }] });
    const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
    const waitFor = async (expression) => {
      for (let i = 0; i < 60; i++) { if (await evaluate(expression)) return; await sleep(150); }
      await screenshot('failed-ui.png');
      console.error(JSON.stringify({ debug: await evaluate('document.body.innerText.slice(0,1800)'), runtimeErrors, screenshot: path.join(output, 'failed-ui.png') }));
      throw new Error(`UI condition failed: ${expression}`);
    };
    const screenshot = async (name) => {
      const image = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
      await fs.writeFile(path.join(output, name), Buffer.from(image.data, 'base64'));
    };
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: base });
    await waitFor(`document.body.innerText.includes('Generate demo')`);
    assert.equal(await evaluate(`document.querySelectorAll('a[href*="/demo/"]').length`), 0, 'no auto-created preview links');
    assert.equal(await evaluate(`[...document.querySelectorAll('button')].filter(button => button.textContent === 'Generate demo').length`), 1, 'blocked contact cannot generate a demo');
    await evaluate(`[...document.querySelectorAll('button')].find(button => button.textContent === 'Generate demo').click()`);
    await waitFor(`Boolean(document.querySelector('[role="dialog"][aria-modal="true"]'))`);
    assert.equal(searchCalls, 1); assert.equal(saveCalls, 0, 'generation never sends');
    assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(button => button.textContent === 'Send reviewed email').disabled`), true);
    await screenshot('manual-review-desktop.png');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await screenshot('manual-review-mobile.png');
    await evaluate(`document.querySelector('[role="dialog"] input[type="checkbox"]').click()`);
    assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(button => button.textContent === 'Send reviewed email').disabled`), false);
    await evaluate(`[...document.querySelectorAll('button')].find(button => button.textContent === 'Send reviewed email').click()`);
    await waitFor(`document.body.innerText.includes('Test SMTP accepted') || !document.querySelector('[role="dialog"]')`);
    assert.equal(saveCalls, 1);
    // Reproduce manual import, including failed saves, double submits and filters.
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
    await evaluate(`[...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Add Single Lead').click()`);
    await waitFor(`Boolean(document.querySelector('#single-lead-form'))`);
    await evaluate(`(() => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; const fields = document.querySelectorAll('#single-lead-form input'); for(const [index,value] of [[0,'synergy'],[2,'+1 512 555 0100'],[4,'IT Consulting']]){set.call(fields[index],value);fields[index].dispatchEvent(new Event('input',{bubbles:true}));} })()`);
    await evaluate(`document.querySelector('#single-lead-form').requestSubmit()`);
    await waitFor(`document.querySelector('#single-lead-form [role=alert]')?.textContent.includes('could not save')`);
    assert.equal(await evaluate(`document.querySelector('#single-lead-form input').value`), 'synergy', 'failed save preserves form values');
    assert.equal(importedLeads.length, 0);
    await screenshot('single-lead-save-failed.png');
    // Existing filters must not hide a newly saved phone-only lead.
    await evaluate(`(() => {const input=document.querySelector('input[placeholder^="Search business"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'unmatched search');input.dispatchEvent(new Event('input',{bubbles:true}));for(const [index,value] of [[0,'CONTACTED'],[1,'WITH_EMAIL']]){const select=[...document.querySelectorAll('select')].find(select=>select.querySelector(index===0?'option[value=CONTACTED]':'option[value=WITH_EMAIL]'));Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(select,value);select.dispatchEvent(new Event('change',{bubbles:true}));}})()`);
    importFails = false;
    await evaluate(`document.querySelector('#single-lead-form').requestSubmit(); document.querySelector('#single-lead-form').requestSubmit()`);
    await waitFor(`!document.querySelector('#single-lead-form') && document.body.innerText.includes('Lead saved: synergy')`);
    assert.equal(importCalls, 2, 'one failed attempt and one successful attempt; duplicate submission prevented');
    assert.equal(importedLeads.length, 1);
    await waitFor(`document.querySelector('input[placeholder^="Search business"]').value === ''`);
    assert.deepEqual(await evaluate(`['CONTACTED','WITH_EMAIL'].map(value=>[...document.querySelectorAll('select')].find(select=>select.querySelector('option[value='+value+']')).value)`), ['ALL', 'ALL']);
    await send('Page.reload');
    await waitFor(`document.body.innerText.includes('synergy') && !document.body.innerText.includes('Loading your')`);
    await screenshot('single-lead-saved-dashboard.png');
    leadListUnavailable = true;
    await evaluate(`document.querySelector('button[title="Refresh leads data"]').click()`);
    await waitFor(`document.body.innerText.includes('Could not load saved leads from the database.')`);
    assert.ok(await evaluate(`document.body.innerText.includes('synergy')`), 'failed refresh preserves visible leads');
    assert.equal(saveCalls, 1, 'manual import never calls the send endpoint');
    await send('Page.navigate', { url: draft.prototype_url });
    await waitFor(`document.body.innerText.includes('Salon appointments')`);
    assert.equal(await evaluate(`/Furnace|Emergency AC|99\\/100|5-star/.test(document.body.innerText)`), false);
    await screenshot('salon-concept-mobile.png');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
    await screenshot('salon-concept-desktop.png');
    assert.deepEqual(runtimeErrors, []);
    console.log(JSON.stringify({ passed: true, checks: ['no automatic demo links', 'synthetic contact blocked', 'separate Generate demo button', 'generation sends no email', 'review checkbox required', 'only explicit send calls endpoint', 'desktop/mobile review dialog', 'manual save failure retains form', 'manual save appears after reload', 'duplicate submit prevented', 'filters cleared after save', 'failed refresh preserves existing leads', 'salon concept excludes HVAC and fabricated claims', 'no browser exceptions'], fixtureOnly: true, realEmailsSent: 0, screenshots: output }));
    await send('Browser.close');
  } finally { socket?.close(); browser.kill(); }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
