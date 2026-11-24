import fs from 'node:fs';
const src = process.argv[2];
const strip = s => s.replace(/<[^>]+>/g, '').replace(/&nbsp;?/g, ' ').replace(/\s+/g, ' ').trim();
const out = [];
for (const f of fs.readdirSync(src + '/pages').filter(f => /^page_id-M_\d{4}[A-Z]?\.html$/.test(f)).sort()) {
  const html = fs.readFileSync(`${src}/pages/${f}`, 'utf8');
  const body = html.match(/<div class="content_main_padding">([\s\S]*?)<div id="footer_addr">/i)[1];
  const id = f.match(/M_(\d{4}[A-Z]?)/)[1];
  const imgs = [...body.matchAll(/<img[^>]*src="([^"]+)"/gi)].map(m => m[1]).filter(s => !/stjak/.test(s));
  const heads = [...body.matchAll(/<h2[^>]*>([\s\S]*?)(?=<h2|<\/h2>|<p|<div)/gi)].map(m => strip(m[1])).filter(Boolean);
  let name = heads.filter(h => !/^\d{4}(-\d{4})?$/.test(h)).pop() || '';
  name = name.replace(/^\d{4}(-\d{4})?\s*/, '');
  const md = fs.readFileSync(`${src}/content/id-M_${id}.md`, 'utf8');
  const credit = (md.match(/Ljósmynd:\s*(.+)/) || [])[1]?.trim() || null;
  let bio = md.replace(/^# .*$/m, '').replace(/<!--.*?-->/g, '').replace(/!\[\]\([^)]*\)/g, '').replace(/^Ljósmynd:.*$/m, '').replace(/^##.*$/gm, '').trim();
  // Some old pages repeat the name as its own line before the bio; drop only that line.
  if (bio.startsWith(name + '\n')) bio = bio.slice(name.length).trim();
  out.push({ id, year: +id.slice(0, 4), name, photo: imgs[0] || null, photoCredit: credit, bio, bioMissing: !bio || /^Í vinnslu/i.test(bio) });
}
// Known errors on the old site
const fix = { '2014A': 'Kristín Þóra Haraldsdóttir', '1997A': 'Halldóra Geirharðsdóttir', '2006A': 'Baltasar Kormákur' };
for (const r of out) if (fix[r.id] && r.name !== fix[r.id]) { r.nameOnOldSite = r.name; r.name = fix[r.id]; }
fs.writeFileSync(src + '/recipients.json', JSON.stringify(out, null, 2));
const have = new Set(fs.readdirSync(src + '/assets/img').map(f => 'img/' + f));
out.forEach(r => console.log(r.year, r.name, !r.photo ? '[no photo]' : have.has(r.photo) ? '' : '[photo not downloaded]', r.bioMissing ? '[no bio]' : '', r.nameOnOldSite ? `(fixed: "${r.nameOnOldSite}")` : ''));
