/**
 * Prefix a site-absolute path ("/styrkthegar") with the configured `base`.
 * On GitHub Pages the site lives under /stefaniusjodur/; on a custom domain base is "/".
 */
export function u(path: string): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base + path;
}
