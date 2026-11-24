// Fetch every 200-status capture listed by the Wayback CDX index (newest capture per URL)
// Usage: node cdxfetch.mjs <sourceDir>
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.argv[2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const cdxUrl = 'https://web.archive.org/cdx/search/cdx?url=stefaniusjodur.is*&output=json&fl=timestamp,original,statuscode,mimetype&filter=statuscode:200';
let rows;
for (let i = 0; i < 5 && !rows; i++) {
  try { rows = await (await fetch(cdxUrl)).json(); } catch { await sleep(5000); }
}
rows = rows.slice(1);
// newest capture per URL (key by path+query, ignore host/www/port)
const latest = new Map();
for (const [ts, orig, , mime] of rows) {
  const key = orig.replace(/^https?:\/\/(www\.)?stefaniusjodur\.is(:80)?\/?/i, '');
  if (/m=admin|tap_admin|highslide\/graphics/.test(key)) continue;
  if (!latest.has(key) || latest.get(key).ts < ts) latest.set(key, { ts, orig, mime });
}
fs.writeFileSync(path.join(OUT, 'cdx-index.json'), JSON.stringify([...latest].map(([k, v]) => ({ path: k, ...v })), null, 2));

function safeName(u) {
  if (u === '' || u === 'index.php') return 'index.html';
  if (u.startsWith('index.php?')) {
    const q = new URLSearchParams(decodeURIComponent(u.slice(10)));
    const id = q.get('id');
    return 'page_' + (id ? `id-${id}` : [...q].filter(([, v]) => v).map(([k, v]) => `${k}-${v}`).join('_')) + '.html';
  }
  return decodeURIComponent(u.split('?')[0]);
}

let got = 0, skipped = 0, failed = [];
for (const [key, { ts, orig, mime }] of latest) {
  const isHtml = mime.includes('html');
  const name = safeName(key);
  const dest = path.join(OUT, isHtml ? 'pages' : 'assets', name);
  // pages: keep one copy per id; prefer existing only if from same or newer ts is unknowable -> overwrite html only if missing
  if (fs.existsSync(dest)) { skipped++; continue; }
  let ok = false;
  for (let i = 0; i < 4 && !ok; i++) {
    try {
      const r = await fetch(`https://web.archive.org/web/${ts}id_/${orig}`);
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        if (isHtml) fs.writeFileSync(dest, new TextDecoder('windows-1252').decode(buf).replace(/charset=iso-8859-1/i, 'charset=utf-8'));
        else fs.writeFileSync(dest, buf);
        ok = true; got++;
        console.log('ok', name);
      } else if (r.status === 404) break;
    } catch {}
    if (!ok) await sleep(2000 * (i + 1));
  }
  if (!ok) failed.push(key);
  await sleep(300);
}
console.log(`fetched ${got}, already had ${skipped}, failed ${failed.length}`);
failed.forEach((f) => console.log('FAIL', f));
