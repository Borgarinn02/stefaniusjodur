// One-time import: converts the scraped old site in _source/ into Astro content + public images.
// Safe to re-run, but it OVERWRITES src/content/* and public/images/* generated from _source.
// Usage: npm run import-source
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, '_source');
const CONTENT = path.join(ROOT, 'src/content');
const IMAGES = path.join(ROOT, 'public/images');

const read = (p) => fs.readFileSync(path.join(SRC, p), 'utf8');
const write = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };

export function slugify(s) {
  return s.toLowerCase()
    .replace(/þ/g, 'th').replace(/ð/g, 'd').replace(/æ/g, 'ae').replace(/ö/g, 'o')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Old site paths -> new public paths
function imgPath(p) {
  if (!p) return p;
  const f = p.replace(/^\/?/, '');
  if (f.startsWith('myndasafn/')) return '/images/' + f;
  const name = f.replace(/^img\//, '');
  if (/^\d{4}/.test(name)) return '/images/styrkthegar/' + name;
  return '/images/' + name;
}
// The old HTML often had spaces inside <em> ("<em>Dauðadansi </em>"), which breaks Markdown
// emphasis. Pair up single '*' per paragraph and move stray whitespace outside the markers.
function fixEmphasis(md) {
  md = md
    .replace(/(\p{L})\*\*(\p{L})/gu, '$1$2')   // <em>Amadeus</em><em>i</em> -> one word
    .replace(/\*\*\*(?=\s|$)/gm, '*')          // closing em followed by an empty <em></em>
    .replace(/(\p{L})\*\*(\s+)\*(?=\p{L})/gu, '$1*$2') // "*Óvitum** *Guðrúnar": close em + empty <em> </em>
    .replace(/\*\*\n(?=\S)/g, '**');            // bold opened at the end of a line
  return md.split(/\n{2,}/).map((para) => {
    const parts = para.split(/(?<!\*)\*(?!\*)/);
    if (parts.length < 3 || parts.length % 2 === 0) return para; // unbalanced: leave alone
    return parts.map((seg, i) => {
      if (i % 2 === 0) return seg;
      const lead = seg.match(/^\s*/)[0], trail = seg.match(/\s*$/)[0];
      const core = seg.trim();
      return core ? `${lead}*${core}*${trail}` : seg;
    }).join('');
  }).join('\n\n');
}
const fixImages = (md) => fixEmphasis(md.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => `![${alt}](${imgPath(src)})`));
const yaml = (v) => JSON.stringify(v ?? null); // JSON strings are valid YAML scalars

function body(file) {
  return fixImages(read(`content/${file}`).replace(/^# .*\n/, '').replace(/<!--.*?-->\n?/g, '')).trim() + '\n';
}

// ---------- images ----------
fs.mkdirSync(path.join(IMAGES, 'styrkthegar'), { recursive: true });
fs.mkdirSync(path.join(IMAGES, 'myndasafn'), { recursive: true });
for (const f of fs.readdirSync(path.join(SRC, 'assets/img'))) {
  const dest = /^\d{4}/.test(f) ? path.join(IMAGES, 'styrkthegar', f) : path.join(IMAGES, f);
  fs.copyFileSync(path.join(SRC, 'assets/img', f), dest);
}
for (const f of fs.readdirSync(path.join(SRC, 'assets/myndasafn'))) {
  fs.copyFileSync(path.join(SRC, 'assets/myndasafn', f), path.join(IMAGES, 'myndasafn', f));
}

// ---------- recipients (styrkþegar) ----------
const recipients = JSON.parse(read('recipients.json'));
for (const r of recipients) {
  const slug = `${r.year}-${slugify(r.name)}`;
  const fm = [
    '---',
    `name: ${yaml(r.name)}`,
    `year: ${r.year}`,
    `photo: ${yaml(fs.existsSync(path.join(SRC, 'assets', r.photo || '_')) ? imgPath(r.photo) : null)}`,
    `photoCredit: ${yaml(r.photoCredit)}`,
    '---',
  ].join('\n');
  write(path.join(CONTENT, 'styrkthegar', slug + '.md'), `${fm}\n\n${r.bioMissing ? '' : fixImages(r.bio).trim() + '\n'}`);
}

// ---------- ceremonies (styrkveitingar) ----------
const ceremonies = [
  ['id-M_S2012.md', 2012, '2012'],
  ['id-M_S2013.md', 2013, '2013'],
  ['id-M2014.md', 2014, '2014'],
  ['id-M2015.md', 2015, '2015'],
  ['id-M2016.md', 2016, '2016–2017'],
  ['id-M2017.md', 2017, '2017–2018'],
];
for (const [file, year, season] of ceremonies) {
  const title = read(`content/${file}`).match(/^# (.*)$/m)[1].trim();
  write(path.join(CONTENT, 'styrkveitingar', `${year}.md`),
    `---\ntitle: ${yaml(title)}\nyear: ${year}\nseason: ${yaml(season)}\n---\n\n${body(file)}`);
}

// ---------- static pages (síður) ----------
const pages = [
  ['id-M_SJODURINN.md', 'um-sjodinn', 'Um minningarsjóðinn', 1],
  ['id-M_STEFANIA.md', 'stefania', 'Frú Stefanía Guðmundsdóttir', 2],
  ['id-M_POUL_ANNA.md', 'poul-reumert-og-anna-borg', 'Poul Reumert og Anna Borg', 3],
  ['id-M_SAGAN.md', 'saga-sjodsins', 'Úr sögu sjóðsins', 4],
  ['id-M_STJAKINN.md', 'stefaniustjakinn', 'Stefaníustjakinn', 5],
];
for (const [file, slug, title, order] of pages) {
  let b = body(file);
  // The old "about" page opened with the latest-award news; keep only the fund description.
  if (slug === 'um-sjodinn') b = b.slice(b.indexOf('Minningasjóður frú Stefaníu'));
  // The trophy page renders the <Stjakinn /> component instead of the old GIF.
  if (slug === 'stefaniustjakinn') b = b.replace(/!\[[^\]]*\]\(\/images\/stjakinn\.gif\)\s*/, '');
  write(path.join(CONTENT, 'sidur', slug + '.md'), `---\ntitle: ${yaml(title)}\norder: ${order}\n---\n\n${b}`);
}

// ---------- gallery (myndasafn) ----------
const gallery = JSON.parse(read('content/pages.json')).find((p) => p.id === 'id-M_MYNDASAFN').images;
const have = new Set(fs.readdirSync(path.join(SRC, 'assets/myndasafn')));
const items = gallery.map((g) => {
  const full = path.basename(g.src), thumb = g.thumb ? path.basename(g.thumb) : full;
  return {
    year: +(full.match(/M(\d{4})/) || [, 0])[1],
    src: imgPath('myndasafn/' + (have.has(full) ? full : thumb)),
    thumb: imgPath('myndasafn/' + (have.has(thumb) ? thumb : full)),
    caption: g.caption.replace(/^\.+$/, '').trim(),
    lowRes: !have.has(full),
  };
}).filter((g) => have.has(path.basename(g.src)));
write(path.join(ROOT, 'src/data/myndasafn.json'), JSON.stringify(items, null, 2) + '\n');

console.log(`Imported ${recipients.length} recipients, ${ceremonies.length} ceremonies, ${pages.length} pages, ${items.length} gallery images.`);
