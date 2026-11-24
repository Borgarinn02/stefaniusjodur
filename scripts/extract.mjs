// Extract main content from crawled pages into content/*.md + content.json
// Usage: node extract.mjs <sourceDir> <outDir>
import fs from 'node:fs';
import path from 'node:path';

const SRC = process.argv[2];
const OUT = process.argv[3];
fs.mkdirSync(OUT, { recursive: true });

const decode = (s) =>
  s.replace(/&nbsp;?/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));

function toMd(html) {
  return decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, n, t) => `\n\n${'#'.repeat(+n)} ${t.replace(/<[^>]+>/g, '').trim()}\n\n`)
      .replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, '**$2**')
      .replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, '*$2*')
      .replace(/<img[^>]*src="([^"]+)"[^>]*>/gi, '\n![]($1)\n')
      .replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, h, t) => (t.includes('![') ? t : `[${t}](${h})`))
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|tr)>/gi, '\n')
      .replace(/<li[^>]*>/gi, '- ')
      .replace(/<[^>]+>/g, '')
  )
    .split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).join('\n')
    .replace(/\n{3,}/g, '\n\n').trim();
}

const pages = [];
for (const f of fs.readdirSync(path.join(SRC, 'pages'))) {
  const html = fs.readFileSync(path.join(SRC, 'pages', f), 'utf8');
  const m = html.match(/<div class="content_main_padding">([\s\S]*?)<div id="footer_addr">/i);
  if (!m) { console.log('no content block:', f); continue; }
  const body = m[1];
  const title = decode((body.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i) || [, ''])[1].replace(/<[^>]+>/g, '').trim());
  const images = [];
  // images wrapped in a caption div
  for (const im of body.matchAll(/<div class="img_[^"]*">([\s\S]*?)<\/div>/gi)) {
    const src = (im[1].match(/<img[^>]*src="([^"]+)"/i) || [])[1];
    if (src) images.push({ src, caption: toMd(im[1].replace(/<img[^>]*>/gi, '')) });
  }
  // highslide gallery: <a href="full.jpg" class="highslide"><img src="thumb"></a> + caption div
  for (const im of body.matchAll(/<a[^>]*href="([^"]+\.(?:jpe?g|png|gif))"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>[\s\S]*?<\/a>\s*(?:<div class="highslide-caption"[^>]*>([\s\S]*?)<\/div>)?/gi)) {
    images.push({ src: im[1], thumb: im[2], caption: im[3] ? toMd(im[3]) : '' });
  }
  const id = f.replace(/^page_/, '').replace(/\.html$/, '');
  const md = `# ${title}\n\n<!-- source: ${f} -->\n\n` + toMd(body.replace(/<h2[^>]*>[\s\S]*?<\/h2>/i, ''));
  fs.writeFileSync(path.join(OUT, id + '.md'), md);
  pages.push({ id, file: f, title, images });
}
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages, null, 2));
console.log(pages.map((p) => `${p.id}: "${p.title}" (${p.images.length} imgs)`).join('\n'));
