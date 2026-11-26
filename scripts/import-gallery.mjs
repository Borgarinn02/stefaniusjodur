// Rebuild src/data/myndasafn.json from the old gallery page, keeping each photo's
// heading (title) and caption (description). Run once; after that edit the JSON by hand.
// Usage: node scripts/import-gallery.mjs [--force]
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'src/data/myndasafn.json');
if (fs.existsSync(OUT) && !process.argv.includes('--force')) {
  console.error('src/data/myndasafn.json already exists — pass --force to overwrite hand edits.');
  process.exit(1);
}
const html = fs.readFileSync(path.join(ROOT, '_source/pages/page_id-M_MYNDASAFN.html'), 'utf8');
const have = new Set(fs.readdirSync(path.join(ROOT, 'public/images/myndasafn')));
const text = (s = '') =>
  s.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;?/g, ' ').replace(/&amp;/g, '&')
    .split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n')
    .replace(/^\.+$/, '').trim();

const re = /<a href="myndasafn\/([^"]+)" class="highslide"[^>]*><img src="myndasafn\/([^"]+)"[^>]*><\/a>\s*(?:<span class="highslide-heading">([\s\S]*?)<\/span>)?\s*(?:<span class="highslide-caption">([\s\S]*?)<\/span>)?/g;
const items = [];
for (const [, full, thumb, heading, caption] of html.matchAll(re)) {
  if (!have.has(full) && !have.has(thumb)) continue;
  const year = +(full.match(/M(\d{4})/) || [, 0])[1];
  let title = text(heading), description = text(caption);
  // Old headings were usually just the year; use the caption's first line as the title instead.
  if (!title || /^\d{4}$/.test(title)) {
    const [first, ...rest] = description.split('\n');
    title = first && first.length < 90 ? first.replace(/\.$/, '') : `Styrkveiting ${year}`;
    description = first && first.length < 90 ? rest.join('\n') : description;
  }
  items.push({
    year,
    src: `/images/myndasafn/${have.has(full) ? full : thumb}`,
    thumb: `/images/myndasafn/${have.has(thumb) ? thumb : full}`,
    title,
    description,
    lowRes: !have.has(full),
  });
}
fs.writeFileSync(OUT, JSON.stringify(items, null, 2) + '\n');
console.log(`${items.length} images, ${items.filter((i) => i.description).length} with descriptions`);
