// @ts-check
import { defineConfig } from 'astro/config';

// Hosting: GitHub Pages serves the site under /stefaniusjodur/.
// When moving to a custom domain (e.g. stefaniusjodur.is), set SITE to that URL and BASE to '/'.
const SITE = 'https://borgarinn02.github.io';
const BASE = '/stefaniusjodur';

/** Prefix site-absolute links/images inside Markdown content ("/images/x.jpg") with BASE. */
function rehypeBase() {
  const prefix = BASE.replace(/\/$/, '');
  const fix = (v) => (typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') && !v.startsWith(prefix + '/') ? prefix + v : v);
  const walk = (node) => {
    if (node.type === 'element') {
      if (node.properties?.src) node.properties.src = fix(node.properties.src);
      if (node.properties?.href) node.properties.href = fix(node.properties.href);
    }
    node.children?.forEach(walk);
  };
  return (tree) => walk(tree);
}

export default defineConfig({
  site: SITE,
  base: BASE,
  markdown: { rehypePlugins: [rehypeBase] },
});
