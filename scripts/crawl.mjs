// Crawl the Wayback Machine snapshot of stefaniusjodur.is
// Usage: node crawl.mjs <outDir>
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.argv[2];
const TS = '20220813212852';
const HOST = 'stefaniusjodur.is';
const start = ['index.php', 'index.php?m=&id=M_MYNDASAFN', ''];

const queue = [...start];
const seen = new Set();
const log = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function norm(u) {
  u = u.replace(/&amp;/g, '&').trim();
  if (/^(mailto:|javascript:|#|data:)/i.test(u)) return null;
  u = u.replace(/^https?:\/\/web\.archive\.org\/web\/\d+[a-z_]*\//, '');
  const m = u.match(/^https?:\/\/(www\.)?stefaniusjodur\.is\/?(.*)$/i);
  if (m) u = m[2];
  else if (/^https?:/i.test(u)) return null; // external
  u = u.replace(/^\.?\//, '');
  if (/m=admin|tap_admin/i.test(u)) return null;
  return u;
}

function safeName(u) {
  if (u === '' || u === 'index.php') return 'index.html';
  if (u.startsWith('index.php?')) {
    const q = new URLSearchParams(u.slice(10));
    const parts = [];
    for (const [k, v] of q) if (v) parts.push(`${k}-${v}`);
    return 'page_' + (parts.join('_') || 'index') + '.html';
  }
  return u.split('?')[0];
}

async function get(u) {
  const url = `https://web.archive.org/web/${TS}id_/http://${HOST}/${u}`;
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url, { redirect: 'follow' });
      if (r.status === 404) return { status: 404 };
      if (r.ok) return { status: 200, buf: Buffer.from(await r.arrayBuffer()), type: r.headers.get('content-type') || '', final: r.url };
    } catch (e) {}
    await sleep(2000 * (i + 1));
  }
  return { status: 'fail' };
}

while (queue.length) {
  const u = queue.shift();
  if (seen.has(u)) continue;
  seen.add(u);
  const res = await get(u);
  const name = safeName(u);
  log.push({ url: u, file: name, status: res.status, final: res.final });
  console.log(res.status, u);
  if (res.status !== 200) continue;
  const isHtml = res.type.includes('html') || name.endsWith('.html');
  const dest = path.join(OUT, isHtml ? 'pages' : 'assets', name);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (isHtml) {
    const text = new TextDecoder('windows-1252').decode(res.buf);
    fs.writeFileSync(dest, text.replace(/charset=iso-8859-1/i, 'charset=utf-8'));
    for (const m of text.matchAll(/(?:href|src|background)\s*=\s*["']([^"']+)["']/gi)) {
      const n = norm(m[1]);
      if (n !== null && !seen.has(n)) queue.push(n);
    }
    for (const m of text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) {
      const n = norm(m[1]);
      if (n !== null && !seen.has(n)) queue.push(n);
    }
  } else {
    fs.writeFileSync(dest, res.buf);
    if (name.endsWith('.css')) {
      const dir = path.posix.dirname(u);
      for (const m of res.buf.toString('latin1').matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) {
        const n = norm(path.posix.normalize(path.posix.join(dir, m[1])));
        if (n !== null && !seen.has(n)) queue.push(n);
      }
    }
  }
  await sleep(400);
}
fs.writeFileSync(path.join(OUT, 'crawl-log.json'), JSON.stringify(log, null, 2));
console.log('done', log.length, 'urls;', log.filter((l) => l.status !== 200).length, 'missing');
