// Render the real demo component using fictional, local-only business fixtures.
// No environment credentials, database access, API calls or email delivery.
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const Module = require('node:module');
const { spawn, execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const WebSocket = require('ws');
const ts = require('typescript');
const React = require('react');
const { renderToString } = require('react-dom/server');

const root = path.resolve(__dirname, '..');
const output = path.join(root, '.local-previews', 'unslop');
const before = process.argv.includes('--before');
const fixtures = {
  salon: { business_name: 'Example Hair Studio', category: 'Hair Salon', city: 'Austin, TX', services: ['Haircuts & styling', 'Hair colour consultation', 'Salon appointments'], services_suggested: false },
  plumbing: { business_name: 'Example Plumbing & Drain Services', category: 'Plumbing', city: 'Dallas, TX', services: ['Plumbing repairs', 'Drain service', 'Plumbing consultation'], services_suggested: true },
  long: { business_name: 'Example Community Heating, Cooling & Home Maintenance Services', category: 'HVAC', city: 'San Antonio, TX', services: ['Heating and air conditioning maintenance consultations', 'AC maintenance'], services_suggested: true },
  empty: { business_name: 'Example Local Business', category: 'Professional Services', services: [], services_suggested: false },
};
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  await fs.mkdir(output, { recursive: true });
  const filename = path.join(root, 'components', 'DemoPrototypeClient.jsx');
  const source = before ? execFileSync('git', ['show', 'HEAD:components/DemoPrototypeClient.jsx'], { cwd: root, encoding: 'utf8' }) : await fs.readFile(filename, 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const cssImports = [...source.matchAll(/import\s+\w+\s+from\s+['"](.+\.module\.css)['"]/g)].map(match => path.resolve(path.dirname(filename), match[1]));
  const styleNames = {};
  let css = '';
  for (const file of cssImports) {
    const contents = await fs.readFile(file, 'utf8');
    css += contents;
    for (const match of contents.matchAll(/\.([a-zA-Z_][\w-]*)/g)) styleNames[match[1]] = match[1];
  }
  if (!cssImports.length) {
    css = (await require('postcss')([require('tailwindcss')({ ...require('../tailwind.config.js'), content: [{ raw: source, extension: 'jsx' }, path.join(root, 'lib', 'demoThemes.js')] }), require('autoprefixer')()]).process(await fs.readFile(path.join(root, 'app', 'globals.css'), 'utf8'), { from: undefined })).css;
  }
  const renderedModule = new Module(filename);
  renderedModule.paths = Module._nodeModulePaths(root);
  renderedModule.require = name => name.endsWith('.module.css') ? styleNames : name === 'react' ? React : require(name);
  // Classic JSX keeps the standalone preview independent of a bundler.
  renderedModule._compile('const React = require("react");\n' + compiled, filename);
  const themeFilename = path.join(root, 'lib', 'demoThemes.js');
  const themeModule = new Module(themeFilename);
  themeModule.paths = Module._nodeModulePaths(root);
  themeModule._compile(ts.transpileModule(await fs.readFile(themeFilename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, themeFilename);
  const scripts = await Promise.all(['react/umd/react.production.min.js', 'react-dom/umd/react-dom.production.min.js', 'lucide-react/dist/umd/lucide-react.min.js'].map(file => fs.readFile(path.join(root, 'node_modules', file), 'utf8')));
  for (const [name, initialLead] of Object.entries(fixtures)) {
    const props = { initialLead, ...(before ? { initialTheme: themeModule.exports.getIndustryTheme(initialLead) } : {}) };
    const markup = renderToString(React.createElement(renderedModule.exports.default, props));
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${name} — local Unslop trial</title><style>html{scroll-behavior:auto}body{margin:0;font-family:Arial,sans-serif}*{box-sizing:border-box}${css}</style></head><body><div id="preview-root">${markup}</div>${scripts.map((script, index) => `<script>${index === 2 ? 'window.react=window.React;' : ''}${script.replace(/<\/script/gi, '<\\/script')}</script>`).join('')}<script>window.module={exports:{}};window.exports=module.exports;window.require=function(name){if(name==='react')return window.React;if(name==='lucide-react')return window.LucideReact;if(name.endsWith('.module.css'))return ${JSON.stringify(styleNames)};throw new Error(name)};const React=window.React;${compiled.replace(/<\/script/gi, '<\\/script')}\nReactDOM.hydrateRoot(document.getElementById('preview-root'),React.createElement(module.exports.default,${JSON.stringify(props)}));</script></body></html>`;
    await fs.writeFile(path.join(output, `${before ? 'before-' : ''}${name}.html`), html);
  }
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'synergy-design-chrome-'));
  const browser = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  let socket;
  try {
    let port;
    for (let i = 0; i < 60; i++) {
      try { port = Number((await fs.readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); break; } catch { await sleep(150); }
    }
    assert.ok(port, 'Chrome started');
    const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
    let nextId = 0;
    const pending = new Map();
    const errors = [];
    socket.on('message', raw => {
      const message = JSON.parse(raw);
      if (message.id) { const item = pending.get(message.id); if (item) { clearTimeout(item.timer); pending.delete(message.id); message.error ? item.reject(new Error(message.error.message)) : item.resolve(message.result); } }
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++nextId; const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 15000); pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params })); });
    const evaluate = async expression => { const value = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (value.exceptionDetails) throw new Error(value.exceptionDetails.text); return value.result.value; };
    await send('Page.enable'); await send('Runtime.enable');
    const checks = [];
    for (const name of before ? ['salon'] : Object.keys(fixtures)) {
      for (const width of name === 'salon' ? [1440, 768, 390, 320] : [390]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height: width === 1440 ? 1000 : 844, deviceScaleFactor: 1, mobile: width < 500 });
        const file = path.join(output, `${before ? 'before-' : ''}${name}.html`).replace(/\\/g, '/');
        await send('Page.navigate', { url: 'file:///' + file });
        for (let i = 0; i < 40; i++) { if (await evaluate("document.readyState==='complete' && Boolean(document.querySelector('form'))")) break; await sleep(100); }
        await sleep(200);
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, `${name}: no overflow at ${width}`);
        if (!before) {
          if (width < 761) {
            await evaluate("document.querySelector('button[aria-controls=demo-navigation]').click()");
            await sleep(50);
            assert.equal(await evaluate("document.querySelector('button[aria-controls=demo-navigation]').getAttribute('aria-expanded')"), 'true', 'mobile navigation opens');
            await evaluate("document.querySelector('#demo-navigation a').click()");
            await sleep(50);
            assert.equal(await evaluate("document.querySelector('button[aria-controls=demo-navigation]').getAttribute('aria-expanded')"), 'false', 'mobile navigation closes after selection');
          }
          if (fixtures[name].services.length) {
            await evaluate("document.querySelector('details summary').click()");
            assert.equal(await evaluate("document.querySelector('details').open"), true, 'service details expand');
            await evaluate("document.querySelector('details summary').click()");
          }
          await evaluate("document.querySelector('form').requestSubmit()");
          await sleep(100);
          assert.ok(await evaluate("document.querySelector('[role=status]')?.textContent.includes('No enquiry was sent')"), `${name}: preview form interaction works`);
          await evaluate("document.querySelector('a[href=\"#services\"]').click()");
          await sleep(100);
          assert.equal(await evaluate('location.hash'), '#services');
          await evaluate('window.scrollTo(0,0)');
          await evaluate('document.activeElement?.blur()');
        }
        await send('Emulation.setDeviceMetricsOverride', { width, height: width === 1440 ? 1000 : 844, deviceScaleFactor: 1, mobile: width < 500 });
        const dimensions = await evaluate('({width:document.documentElement.clientWidth,height:document.documentElement.scrollHeight})');
        const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: dimensions.width, height: dimensions.height, scale: 1 } });
        const screenshot = `${before ? 'before-' : ''}${name}-${width}.png`;
        await fs.writeFile(path.join(output, screenshot), Buffer.from(shot.data, 'base64'));
        checks.push({ name, width, screenshot });
      }
    }
    assert.deepEqual(errors, [], 'No browser exceptions');
    if (!before) {
      const review = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unslop design trial</title><style>body{margin:0;background:#f7f4ee;color:#29241f;font:15px/1.6 Arial,sans-serif}header{padding:32px 5%;border-bottom:1px solid #ddd}h1{font:40px Georgia,serif;margin:0}a{color:#633647}nav{display:flex;gap:24px;flex-wrap:wrap;margin-top:16px}main{display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:32px 5%}h2{font-size:16px;font-weight:500}img{display:block;width:100%;border:1px solid #ddd;border-radius:12px}p{max-width:720px}@media(max-width:700px){main{grid-template-columns:1fr}}</style></head><body><header><h1>A different direction.</h1><p>The same fictional business and service list, before and after an Unslop design pass. Local review only.</p><nav><a href="salon.html">Open interactive salon preview</a><a href="plumbing.html">Open plumbing preview</a><a href="salon-390.png">See mobile screenshot</a></nav></header><main><section><h2>Before</h2><img src="before-salon-1440.png" alt="Original dark salon concept"></section><section><h2>After</h2><img src="salon-1440.png" alt="Revised salon concept with warm paper and burgundy service menu"></section></main></body></html>`;
      await fs.writeFile(path.join(output, 'index.html'), review);
    }
    console.log(JSON.stringify({ output, before, checks, browserErrors: errors, fixtureOnly: true }));
    await send('Browser.close');
  } finally { socket?.close(); browser.kill(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
